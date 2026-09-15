"""
LogSetu — Hash-Chain Engine
Tamper-evident hash chain with Ed25519 cryptographic signing.

Every raw log gets a SHA-256 content hash. Hashes chain to the previous
entry: chain_hash_n = SHA256(chain_hash_{n-1} || content_hash_n).
Periodic checkpoints get signed with Ed25519 so authenticity can be
verified externally with just the public key.
"""
from __future__ import annotations

import hashlib
import threading
from datetime import datetime, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from app.config import CHECKPOINT_INTERVAL, KEYS_DIR
from app.models.events import ChainStatus, HashBlock


class HashChainEngine:
    """
    In-memory hash chain with Ed25519 signing.
    Thread-safe for concurrent ingestion.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._chain: list[HashBlock] = []
        self._block_counter: int = 891_238  # Initial baseline block sequence counter
        self._private_key: Ed25519PrivateKey | None = None
        self._public_key: Ed25519PublicKey | None = None
        self._public_key_hex: str = ""

        # Tamper simulation state (supports multiple corrupted blocks)
        self._tampered_blocks_backup: dict[int, HashBlock] = {}
        self._tampered_raw_backup: dict[str, str] = {}

        self._load_or_generate_keys()
        self._seed_genesis()

    # ── Key Management ───────────────────────────────────────────────────

    def _load_or_generate_keys(self) -> None:
        """Load existing Ed25519 keypair or generate a new one."""
        priv_path = KEYS_DIR / "ed25519_private.pem"
        pub_path = KEYS_DIR / "ed25519_public.pem"

        if priv_path.exists() and pub_path.exists():
            priv_bytes = priv_path.read_bytes()
            self._private_key = serialization.load_pem_private_key(priv_bytes, password=None)  # type: ignore
            pub_bytes = pub_path.read_bytes()
            self._public_key = serialization.load_pem_public_key(pub_bytes)  # type: ignore
        else:
            self._private_key = Ed25519PrivateKey.generate()
            self._public_key = self._private_key.public_key()

            # Persist keys
            priv_pem = self._private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            )
            pub_pem = self._public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            priv_path.write_bytes(priv_pem)
            pub_path.write_bytes(pub_pem)

        # Cache hex representation for API responses
        raw_pub = self._public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        self._public_key_hex = raw_pub.hex()

    # ── Hashing ──────────────────────────────────────────────────────────

    @staticmethod
    def content_hash(raw_text: str) -> str:
        """SHA-256 hash of raw log content."""
        return hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

    @staticmethod
    def chain_hash(previous_hash: str, content_hash: str) -> str:
        """Chain link: H(previous || content)."""
        combined = f"{previous_hash}{content_hash}"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()

    # ── Signing ──────────────────────────────────────────────────────────

    def sign(self, data: str) -> str:
        """Sign data with Ed25519 private key, return hex signature."""
        if not self._private_key:
            return ""
        sig = self._private_key.sign(data.encode("utf-8"))
        return sig.hex()

    def verify_signature(self, data: str, signature_hex: str) -> bool:
        """Verify an Ed25519 signature."""
        if not self._public_key or not signature_hex:
            return False
        try:
            sig_bytes = bytes.fromhex(signature_hex)
            self._public_key.verify(sig_bytes, data.encode("utf-8"))
            return True
        except (InvalidSignature, ValueError, TypeError):
            return False

    # ── Genesis Block ────────────────────────────────────────────────────

    def _seed_genesis(self) -> None:
        """Create genesis block if chain is empty."""
        if self._chain:
            return

        genesis_hash = self.content_hash("LOGSETU_GENESIS_BLOCK")
        genesis = HashBlock(
            block_id=self._block_counter,
            block_hash=genesis_hash,
            previous_hash="0" * 64,
            event_count=0,
            events=[],
            timestamp=datetime.now(timezone.utc),
            status=ChainStatus.SEALED,
            description="Genesis Block — LogSetu Hash Chain Initialized",
            is_checkpoint=True,
            signature=self.sign(genesis_hash),
            public_key=self._public_key_hex,
        )
        self._chain.append(genesis)

    # ── Append to Chain ──────────────────────────────────────────────────

    def append(self, raw_text: str, event_id: str, description: str = "", custom_name: str = "") -> HashBlock:
        """
        Add a new event to the hash chain.
        Returns the new block.
        """
        with self._lock:
            c_hash = self.content_hash(raw_text)
            prev_hash = self._chain[-1].block_hash if self._chain else "0" * 64
            new_hash = self.chain_hash(prev_hash, c_hash)

            self._block_counter += 1
            is_checkpoint = (self._block_counter % CHECKPOINT_INTERVAL == 0)

            block = HashBlock(
                block_id=self._block_counter,
                block_hash=new_hash,
                previous_hash=prev_hash,
                event_count=1,
                events=[event_id],
                timestamp=datetime.now(timezone.utc),
                status=ChainStatus.SEALED,
                description=description or f"Event {event_id}",
                custom_name=custom_name or "",
                is_checkpoint=is_checkpoint,
                signature=self.sign(new_hash) if is_checkpoint else "",
                public_key=self._public_key_hex if is_checkpoint else "",
            )
            self._chain.append(block)
            return block

    # ── Verification ─────────────────────────────────────────────────────

    def verify_chain(self) -> dict:
        """
        Verify entire chain integrity including raw storage content hashes.
        Returns { valid: bool, is_valid: bool, broken_at: int | None, first_broken_block_id: int | None, details: str }
        """
        with self._lock:
            if len(self._chain) < 2:
                return {"valid": True, "is_valid": True, "broken_at": None, "first_broken_block_id": None, "details": "Chain has fewer than 2 blocks."}

            from app.storage.raw_store import get_raw_store
            raw_store = get_raw_store()

            for i in range(1, len(self._chain)):
                current = self._chain[i]
                previous = self._chain[i - 1]

                # Check if block was explicitly tampered
                if current.status == ChainStatus.TAMPERED:
                    return {
                        "valid": False,
                        "is_valid": False,
                        "broken_at": current.block_id,
                        "first_broken_block_id": current.block_id,
                        "details": f"Chain broken at block #{current.block_id}: Block marked tampered.",
                    }

                # Check raw content in storage
                if current.events:
                    raw_evt = raw_store.get(current.events[0])
                    if raw_evt:
                        actual_c_hash = self.content_hash(raw_evt.raw_text)
                        if raw_evt.content_hash and actual_c_hash != raw_evt.content_hash:
                            current.status = ChainStatus.TAMPERED
                            return {
                                "valid": False,
                                "is_valid": False,
                                "broken_at": current.block_id,
                                "first_broken_block_id": current.block_id,
                                "tamper_type": "raw_content_altered",
                                "details": (
                                    f"Tamper detected in raw storage at block #{current.block_id}: "
                                    f"Stored content re-hashes to {actual_c_hash[:16]}... "
                                    f"which differs from sealed SHA-256 {raw_evt.content_hash[:16]}..."
                                ),
                            }

                # Check parent hash linkage
                if current.previous_hash != previous.block_hash:
                    return {
                        "valid": False,
                        "is_valid": False,
                        "broken_at": current.block_id,
                        "first_broken_block_id": current.block_id,
                        "details": (
                            f"Chain broken at block #{current.block_id}: "
                            f"expected previous_hash={previous.block_hash[:16]}... "
                            f"but got {current.previous_hash[:16]}..."
                        ),
                    }

                # Check checkpoint signature
                if current.is_checkpoint and current.signature and not self.verify_signature(current.block_hash, current.signature):
                    return {
                        "valid": False,
                        "is_valid": False,
                        "broken_at": current.block_id,
                        "first_broken_block_id": current.block_id,
                        "details": f"Signature verification failed at checkpoint block #{current.block_id}.",
                    }

            return {"valid": True, "is_valid": True, "broken_at": None, "first_broken_block_id": None, "details": "All blocks verified. Chain integrity: 100%."}

    # ── Tamper Simulation (for live demo & generic verification) ──────────

    def simulate_tamper(self, block_id: int | None = None, block_offset: int = 2, tamper_raw: bool = True) -> dict:
        """
        Deliberately corrupt a block or its stored raw event to demonstrate generic tamper detection.
        If block_id is given, corrupts that specific block/event. Otherwise uses block_offset.
        """
        with self._lock:
            if not self._chain:
                return {"success": False, "error": "No blocks in chain."}

            idx = None
            if block_id is not None:
                for i, b in enumerate(self._chain):
                    if b.block_id == block_id:
                        idx = i
                        break
                if idx is None:
                    return {"success": False, "error": f"Block #{block_id} not found."}
            else:
                if len(self._chain) < block_offset + 1:
                    idx = len(self._chain) - 1
                else:
                    idx = len(self._chain) - block_offset

            block = self._chain[idx]

            # Backup original block if not already backed up
            if idx not in self._tampered_blocks_backup:
                self._tampered_blocks_backup[idx] = block.model_copy()

            from app.storage.raw_store import get_raw_store
            raw_store = get_raw_store()

            tampered_event_id = None
            orig_text = ""
            mod_text = ""

            if tamper_raw and block.events:
                eid = block.events[0]
                raw_evt = raw_store.get(eid)
                if raw_evt:
                    tampered_event_id = eid
                    if eid not in self._tampered_raw_backup:
                        self._tampered_raw_backup[eid] = raw_evt.raw_text
                    orig_text = raw_evt.raw_text
                    mod_text = raw_evt.raw_text + " [HACKED_INJECTION: BYPASS_AUTH]"
                    raw_evt.raw_text = mod_text

            # Corrupt block hash and set status TAMPERED
            corrupted = "DEADBEEF" + block.block_hash[8:]
            self._chain[idx] = block.model_copy(update={
                "block_hash": corrupted,
                "status": ChainStatus.TAMPERED,
                "description": f"TAMPERED: {block.description}",
            })

            return {
                "success": True,
                "tampered_block_id": block.block_id,
                "tampered_event_id": tampered_event_id,
                "tamper_mode": "raw_content_altered" if tampered_event_id else "block_hash_corrupted",
                "original_hash": block.block_hash[:16] + "...",
                "corrupted_hash": corrupted[:16] + "...",
                "original_text": orig_text,
                "modified_text": mod_text,
            }

    def heal_tamper(self) -> dict:
        """Restore all tampered blocks and their stored raw content from backup."""
        with self._lock:
            from app.storage.raw_store import get_raw_store
            raw_store = get_raw_store()

            # Restore all raw events
            for eid, orig_text in self._tampered_raw_backup.items():
                raw_evt = raw_store.get(eid)
                if raw_evt:
                    raw_evt.raw_text = orig_text
            self._tampered_raw_backup.clear()

            # Restore all blocks in hash chain from original backups
            for idx, original_block in self._tampered_blocks_backup.items():
                if 0 <= idx < len(self._chain):
                    self._chain[idx] = original_block.model_copy(update={
                        "status": ChainStatus.RESTORED,
                    })
            self._tampered_blocks_backup.clear()

            # Recalculate any remaining blocks marked TAMPERED
            for i, b in enumerate(self._chain):
                if b.status == ChainStatus.TAMPERED:
                    prev_hash = self._chain[i - 1].block_hash if i > 0 else "0" * 64
                    recomputed = self._hash_block(b.block_id, prev_hash, b.merkle_root)
                    self._chain[i] = b.model_copy(update={
                        "block_hash": recomputed,
                        "status": ChainStatus.RESTORED,
                        "description": b.description.replace("TAMPERED: ", ""),
                    })

            return {"success": True, "details": "All chain blocks and raw storage restored from untampered backup."}

    # ── Accessors ────────────────────────────────────────────────────────

    def get_recent_blocks(self, count: int = 10) -> list[HashBlock]:
        """Return the N most recent blocks (newest first)."""
        with self._lock:
            return list(reversed(self._chain[-count:]))

    def get_block(self, block_id: int) -> HashBlock | None:
        """Get a specific block by ID."""
        with self._lock:
            for block in self._chain:
                if block.block_id == block_id:
                    return block
            return None

    def get_latest_checkpoint(self) -> HashBlock | None:
        """Return the most recent signed checkpoint."""
        with self._lock:
            for block in reversed(self._chain):
                if block.is_checkpoint:
                    return block
            return None

    def total_blocks(self) -> int:
        with self._lock:
            return len(self._chain)

    def latest_block_id(self) -> int:
        with self._lock:
            return self._chain[-1].block_id if self._chain else 0

    @property
    def public_key_hex(self) -> str:
        return self._public_key_hex


# ── Singleton ────────────────────────────────────────────────────────────────
_engine: HashChainEngine | None = None


def get_hashchain_engine() -> HashChainEngine:
    """Get or create the global hash-chain engine singleton."""
    global _engine
    if _engine is None:
        _engine = HashChainEngine()
    return _engine
