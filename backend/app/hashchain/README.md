# Hash-chain (tamper-evidence)
Every raw log gets a content hash; hashes chain to the previous entry
(hash_n = H(hash_n-1 + content_n)). Periodic checkpoints get signed with a
private key (Ed25519/RSA) so authenticity can be verified externally with
just the public key. Breaking the chain = tamper detected.
