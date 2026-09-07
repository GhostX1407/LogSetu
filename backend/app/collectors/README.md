# Collectors
Syslog listener, file tailer, API poller, cloud-native log pull.
Each collector's only job: get raw bytes + minimal metadata (source_ip, received_at)
into the Raw Store as fast as possible. No parsing here.
