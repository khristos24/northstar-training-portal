# Wazuh instructor setup

This repository provides examples, not a connected detection service. An upload receipt means the app stored the file; only your independently verified Wazuh alerts establish detection.

1. Enroll the Ubuntu host agent with your own Wazuh manager. Use your existing authorised enrollment procedure; manager address and enrollment secrets are instructor-only.
2. Merge `agent-ossec-snippet.xml` into the agent configuration. The host path is **/opt/northstar/uploads**, not the container path. `check_all` captures hashes/metadata; content diff reporting is intentionally off.
3. Merge unused rule IDs from `local-rules.xml` into the manager's local rules. Validate with `/var/ossec/bin/wazuh-logtest`. Preserve existing rules.
4. Read and verify the **current official [FIM-to-YARA integration](https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/fim-yara.html)** for your installed Wazuh version before enabling it. Configure its active response for the Northstar FIM creation rule (100514), with scans restricted to the monitored directory. Use the harmless instructor file only; skip all malware download examples.
5. Install an instructor-reviewed YARA package. Copy `yara/eicar-training.yar.example` to an instructor-controlled rules directory, remove the `.example` suffix, and make it read-only to students. Do not fetch community rule collections automatically.
6. The official integration emits scan results that need decoding. Compare its exact format with `local-decoders.xml` before merging. Test a representative result and confirm rule 100515 identifies `Northstar_EICAR_Training`.
7. Restart/reload only the required Wazuh components using your established maintenance procedure. Check agent connection and errors.

## Verify in class

Upload a harmless plain-text fixture first. Correlate the receipt's UUID, timestamp and SHA-256 with the app log and FIM file creation. Then, in vulnerable mode, upload the instructor-supplied harmless EICAR artifact and confirm the separate YARA alert. Antivirus on the instructor's workstation may intercept that file before upload.

No malware, active-response script or EICAR artifact is bundled. Do not disable endpoint security to force an upload. The supplied YARA marker rule is a teaching example and can match text quoting the marker; it is not an exact EICAR file validator. Secured mode rejects this marker.

Retain `/var/log/northstar/security.json` after reset. The reset deletes database exercise records and inert uploaded artifacts, while appending a new reset event to the retained host log.
