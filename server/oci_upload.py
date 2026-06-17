import base64
import json
import os
import sys
from datetime import datetime, timedelta, timezone

import oci


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception as error:
        fail(f"Could not read upload payload: {error}")

    required = ["region", "namespace", "bucket", "imageObjectName", "metadataObjectName", "imageBase64"]
    missing = [key for key in required if not payload.get(key)]
    if missing:
        fail(f"Missing required OCI upload fields: {', '.join(missing)}")

    try:
        config_file = os.environ.get("OCI_CONFIG_FILE")
        profile = os.environ.get("OCI_CONFIG_PROFILE", "DEFAULT")
        config = oci.config.from_file(config_file, profile) if config_file else oci.config.from_file(profile_name=profile)
        config["region"] = payload["region"]
        client = oci.object_storage.ObjectStorageClient(config)
        namespace = payload["namespace"]
        bucket = payload["bucket"]
        image_bytes = base64.b64decode(payload["imageBase64"])
        metadata_bytes = json.dumps(payload.get("metadata") or {}, indent=2).encode("utf-8")

        client.put_object(
            namespace,
            bucket,
            payload["imageObjectName"],
            image_bytes,
            content_type="image/png",
        )
        client.put_object(
            namespace,
            bucket,
            payload["metadataObjectName"],
            metadata_bytes,
            content_type="application/json",
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=int(payload.get("parDays") or 7))
        details = oci.object_storage.models.CreatePreauthenticatedRequestDetails(
            name=payload.get("parName") or f"agentifyme-blueprint-{int(datetime.now().timestamp())}",
            access_type=oci.object_storage.models.CreatePreauthenticatedRequestDetails.ACCESS_TYPE_OBJECT_READ,
            object_name=payload["imageObjectName"],
            time_expires=expires_at,
        )
        par = client.create_preauthenticated_request(namespace, bucket, details).data
        download_url = f"https://objectstorage.{payload['region']}.oraclecloud.com{par.access_uri}"

        print(
            json.dumps(
                {
                    "namespace": namespace,
                    "bucket": bucket,
                    "objectName": payload["imageObjectName"],
                    "metadataObjectName": payload["metadataObjectName"],
                    "downloadUrl": download_url,
                    "accessUri": par.access_uri,
                    "expiresAt": expires_at.isoformat(),
                }
            )
        )
    except Exception as error:
        fail(f"OCI upload failed: {error}")


if __name__ == "__main__":
    main()
