# Biometrik FCS Python Service

This service handles the deterministic deformation intelligence for the Biometrik FCS module.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

## Endpoints

- `POST /biometrik-fcs/weights`: Calculates morph weights based on GA and biometric measurements.
