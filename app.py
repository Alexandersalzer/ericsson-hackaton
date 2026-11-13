"""Streamlit UI (phase 4). Reads files in data/output/ only, never runs heavy processing.

Run with: streamlit run app.py
"""
import streamlit as st

st.set_page_config(page_title="Ericsson Data Vault", layout="wide")
st.title("Ericsson Data Vault")
st.info("UI coming in phase 4: Overview, Search, Timeline, Duplicates. See SPEC.md §7.")
