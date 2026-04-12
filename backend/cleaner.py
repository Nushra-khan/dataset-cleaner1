import pandas as pd
import numpy as np
import re
from datetime import datetime

WORD_TO_NUM = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
    "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000,
}

BOOL_TRUE = {"yes", "true", "1", "y", "t", "on", "si", "oui"}
BOOL_FALSE = {"no", "false", "0", "n", "f", "off", "non"}


def words_to_number(text):
    """Convert word-based numbers to numeric values."""
    if not isinstance(text, str):
        return None
    text_lower = text.lower().strip()
    # Try direct conversion first
    try:
        return float(text_lower.replace(",", ""))
    except ValueError:
        pass
    # Try word-to-number
    parts = text_lower.split()
    total = 0
    current = 0
    matched = False
    for part in parts:
        part = part.strip("-").strip()
        if part in WORD_TO_NUM:
            matched = True
            val = WORD_TO_NUM[part]
            if val == 1000:
                current = (current if current else 1) * 1000
                total += current
                current = 0
            elif val == 100:
                current = (current if current else 1) * 100
            else:
                current += val
        else:
            return None
    if matched:
        return float(total + current)
    return None


def infer_column_type(series):
    """Infer the semantic type of a column."""
    series_clean = series.dropna().astype(str).str.strip()
    if series_clean.empty:
        return "unknown"

    # Boolean check
    bool_vals = series_clean.str.lower().unique()
    if all(v in BOOL_TRUE | BOOL_FALSE for v in bool_vals):
        return "boolean"

    # Datetime check
    date_patterns = [
        r"\d{4}-\d{2}-\d{2}", r"\d{2}/\d{2}/\d{4}",
        r"\d{2}-\d{2}-\d{4}", r"\d{4}/\d{2}/\d{2}",
    ]
    sample = series_clean.head(20)
    date_matches = sum(
        1 for v in sample
        if any(re.match(p, v) for p in date_patterns)
    )
    if date_matches > len(sample) * 0.6:
        return "datetime"

    # Numeric check (including word numbers)
    numeric_count = 0
    for v in series_clean.head(30):
        try:
            float(v.replace(",", ""))
            numeric_count += 1
        except ValueError:
            if words_to_number(v) is not None:
                numeric_count += 1
    if numeric_count > len(series_clean.head(30)) * 0.6:
        return "numeric"

    # Categorical
    unique_ratio = series_clean.nunique() / len(series_clean)
    if unique_ratio < 0.5:
        return "categorical"

    return "text"


def profile_dataset(df):
    """Generate a data profile for the dataset."""
    profile = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": {},
        "total_missing": int(df.isnull().sum().sum()),
        "total_duplicates": int(df.duplicated().sum()),
    }

    for col in df.columns:
        missing = int(df[col].isnull().sum())
        missing_pct = round(missing / len(df) * 100, 2) if len(df) > 0 else 0
        inferred_type = infer_column_type(df[col])
        profile["columns"][col] = {
            "inferred_type": inferred_type,
            "missing": missing,
            "missing_pct": missing_pct,
            "unique_values": int(df[col].nunique()),
            "dtype": str(df[col].dtype),
        }

    return profile


def clean_dataset(df):
    """Full cleaning pipeline."""
    report = {
        "rows_before": len(df),
        "columns_before": len(df.columns),
        "steps": [],
        "rows_after": 0,
        "columns_after": 0,
    }

    # --- Step 1: Normalize column names ---
    original_cols = df.columns.tolist()
    df.columns = [
        re.sub(r"[^\w]", "_", col.strip().lower()).strip("_")
        for col in df.columns
    ]
    renamed = {o: n for o, n in zip(original_cols, df.columns.tolist()) if o != n}
    if renamed:
        report["steps"].append({
            "action": "Normalized column names",
            "detail": f"Renamed {len(renamed)} column(s) to snake_case",
            "icon": "columns"
        })

    # --- Step 2: Remove duplicates ---
    dups = df.duplicated().sum()
    if dups > 0:
        df = df.drop_duplicates()
        report["steps"].append({
            "action": "Removed duplicate rows",
            "detail": f"Dropped {dups} duplicate row(s)",
            "icon": "copy"
        })

    # --- Step 3: Trim whitespace ---
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace("nan", np.nan).replace("", np.nan)

    report["steps"].append({
        "action": "Trimmed whitespace",
        "detail": f"Cleaned whitespace in {len(str_cols)} text column(s)",
        "icon": "scissors"
    })

    # --- Step 4: Infer types and fix ---
    bool_fixed = []
    numeric_fixed = []
    date_fixed = []
    category_lowered = []

    for col in df.columns:
        col_type = infer_column_type(df[col])

        if col_type == "boolean":
            df[col] = df[col].apply(
                lambda v: True if str(v).lower() in BOOL_TRUE
                else (False if str(v).lower() in BOOL_FALSE else np.nan)
            )
            bool_fixed.append(col)

        elif col_type == "numeric":
            def to_num(v):
                if pd.isna(v):
                    return np.nan
                try:
                    return float(str(v).replace(",", ""))
                except ValueError:
                    result = words_to_number(str(v))
                    return result if result is not None else np.nan
            df[col] = df[col].apply(to_num)
            df[col] = pd.to_numeric(df[col], errors="coerce")
            numeric_fixed.append(col)

        elif col_type == "datetime":
            df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
            df[col] = df[col].dt.strftime("%Y-%m-%d")
            date_fixed.append(col)

        elif col_type == "categorical":
            df[col] = df[col].str.lower().str.strip() if df[col].dtype == object else df[col]
            category_lowered.append(col)

    if bool_fixed:
        report["steps"].append({
            "action": "Standardized boolean values",
            "detail": f"Converted yes/no → True/False in: {', '.join(bool_fixed)}",
            "icon": "toggle"
        })
    if numeric_fixed:
        report["steps"].append({
            "action": "Converted text to numeric",
            "detail": f"Parsed numeric values (incl. word numbers) in: {', '.join(numeric_fixed)}",
            "icon": "hash"
        })
    if date_fixed:
        report["steps"].append({
            "action": "Standardized date formats",
            "detail": f"Normalized dates to YYYY-MM-DD in: {', '.join(date_fixed)}",
            "icon": "calendar"
        })
    if category_lowered:
        report["steps"].append({
            "action": "Normalized categorical values",
            "detail": f"Lowercased categorical columns: {', '.join(category_lowered)}",
            "icon": "tag"
        })

    # --- Step 5: Handle missing values ---
    filled_cols = []
    for col in df.columns:
        missing = df[col].isnull().sum()
        if missing == 0:
            continue

        dtype = df[col].dtype
        if pd.api.types.is_numeric_dtype(dtype):
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            filled_cols.append(f"{col} (median={round(median_val, 2)})")
        elif pd.api.types.is_datetime64_any_dtype(dtype) or str(dtype) == "object":
            if pd.api.types.is_datetime64_any_dtype(dtype):
                df[col] = df[col].fillna(method="ffill").fillna(method="bfill")
            else:
                mode_vals = df[col].mode()
                if not mode_vals.empty:
                    df[col] = df[col].fillna(mode_vals[0])
                    filled_cols.append(f"{col} (mode='{mode_vals[0]}')")
                else:
                    df[col] = df[col].fillna("unknown")
                    filled_cols.append(f"{col} (default='unknown')")

    if filled_cols:
        report["steps"].append({
            "action": "Filled missing values",
            "detail": f"Imputed {len(filled_cols)} column(s): " + "; ".join(filled_cols),
            "icon": "droplet"
        })

    # --- Step 6: Outlier handling (IQR) ---
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outlier_cols = []
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        outliers = ((df[col] < lower) | (df[col] > upper)).sum()
        if outliers > 0:
            df[col] = df[col].clip(lower=lower, upper=upper)
            outlier_cols.append(f"{col} ({outliers} capped)")

    if outlier_cols:
        report["steps"].append({
            "action": "Handled outliers using IQR",
            "detail": f"Capped extreme values in: {', '.join(outlier_cols)}",
            "icon": "activity"
        })

    report["rows_after"] = len(df)
    report["columns_after"] = len(df.columns)
    report["rows_removed"] = report["rows_before"] - report["rows_after"]

    return df, report
