"""
Train a cry-classification model on Donate-a-Cry features CSV.

Usage:
  python backend/train_model.py

Optional env vars:
  CRY_DATASET_PATH=./donateacry-corpus_features_final.csv
  CRY_MODEL_DIR=./backend/models
"""

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_sample_weight

try:
    from xgboost import XGBClassifier
except Exception as exc:
    raise RuntimeError(
        "xgboost is required. Install dependencies with: pip install -r backend/requirements.txt"
    ) from exc


FEATURE_COLUMNS = [
    "RMS_Mean",
    "ZCR_Mean",
    "SC_Mean",
    "SBAN_Mean",
    "SCON_Mean",
    "MFCCs13Mean",
    "MFCCs1",
    "MFCCs2",
    "MFCCs3",
    "MFCCs4",
    "MFCCs5",
    "MFCCs6",
    "MFCCs7",
    "MFCCs8",
    "MFCCs9",
    "MFCCs10",
    "MFCCs11",
    "MFCCs12",
    "MFCCs13",
]


def build_label_mapping(df: pd.DataFrame) -> tuple[dict, dict]:
    """Infer semantic class names from folder names in Cry_Audio_File paths."""
    folders = df["Cry_Audio_File"].astype(str).str.extract(r"/([^/]+)/[^/]+$")[0]
    df_tmp = df.copy()
    df_tmp["folder"] = folders

    id_to_name = (
        df_tmp.groupby("Cry_Reason")["folder"]
        .agg(lambda s: s.value_counts().index[0])
        .to_dict()
    )
    name_to_id = {v: int(k) for k, v in id_to_name.items()}
    return id_to_name, name_to_id


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    dataset_path = Path(
        os.environ.get("CRY_DATASET_PATH", str(root / "donateacry-corpus_features_final.csv"))
    )
    model_dir = Path(os.environ.get("CRY_MODEL_DIR", str(root / "backend" / "models")))
    model_dir.mkdir(parents=True, exist_ok=True)

    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    df = pd.read_csv(dataset_path)
    required = set(FEATURE_COLUMNS + ["Cry_Reason", "Cry_Audio_File"])
    missing = sorted(list(required.difference(df.columns)))
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    id_to_name, _ = build_label_mapping(df)
    class_names = [id_to_name[i] for i in sorted(id_to_name.keys())]

    X = df[FEATURE_COLUMNS].astype(np.float32)
    y = df["Cry_Reason"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    sample_weight = compute_sample_weight(class_weight="balanced", y=y_train)

    model = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=4,
    )
    model.fit(X_train, y_train, sample_weight=sample_weight)

    y_pred = model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "macro_f1": float(f1_score(y_test, y_pred, average="macro")),
        "weighted_f1": float(f1_score(y_test, y_pred, average="weighted")),
    }

    report = classification_report(
        y_test,
        y_pred,
        output_dict=True,
        zero_division=0,
    )

    model_path = model_dir / "cry_xgb_model.joblib"
    meta_path = model_dir / "cry_xgb_model_meta.json"

    joblib.dump(model, model_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "model_name": "xgboost",
                "feature_columns": FEATURE_COLUMNS,
                "class_names": class_names,
                "label_id_to_name": {str(k): v for k, v in id_to_name.items()},
                "metrics": metrics,
                "classification_report": report,
                "dataset_path": str(dataset_path),
                "num_samples": int(len(df)),
            },
            f,
            indent=2,
        )

    print("Training complete")
    print(f"Model: {model_path}")
    print(f"Metadata: {meta_path}")
    print("Metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")


if __name__ == "__main__":
    main()
