import React, { Component } from "react";
import styles from "./instructions.css";
import classNames from "classnames";
import FullScreenInstructions from "../full-screen-instructions/full-screen-instructions";

class Instructions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      showFullScreen: false,
      showEditor: false,
      draft: props.text || "",
      saving: false,
      error: ""
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.text !== this.props.text) {
      this.setState({ draft: this.props.text || "" });
    }
  }

  openFullScreen = () => {
    try { document.body.classList.add("no-scroll"); } catch {}
    this.setState({ showFullScreen: true });
  };
  closeFullScreen = () => {
    try { document.body.classList.remove("no-scroll"); } catch {}
    this.setState({ showFullScreen: false });
  };

  openEditor = () => this.setState({ showEditor: true, draft: this.props.text || "", error: "" });
  closeEditor = () => {
    if (this.state.saving) return;
    this.setState({ showEditor: false, error: "" });
  };

  onDraftChange = (e) => this.setState({ draft: e.target.value });

  save = async () => {
    const { onSave } = this.props;
    const { draft } = this.state;
    if (!onSave) return;
    try {
      this.setState({ saving: true, error: "" });
      await onSave(draft);
      this.setState({ saving: false, showEditor: false });
    } catch (err) {
      this.setState({ saving: false, error: err?.message || "Failed to save. Try again." });
    }
  };

  render() {
    const { showFullScreen, showEditor, draft, saving, error } = this.state;
    const { text = "", canEdit = false, label = "Instructions" } = this.props;

    return (
      <div className={styles.wrap}>
        {/* Top bar */}
        <div className={styles.bar}>
          <div className={styles.left}>
            <div className={styles.title}>
              {label} {canEdit && <span className={styles.badge}>admin</span>}
            </div>
            <div className={classNames(styles.preview, styles.clamp2)}>
              {text || "No instructions yet."}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btn} onClick={this.openFullScreen}>Full Screen</button>
            {canEdit && (
              <button className={classNames(styles.btn, styles.primary)} onClick={this.openEditor}>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Full-screen view */}
        {showFullScreen && (
          <FullScreenInstructions text={text} onClose={this.closeFullScreen} />
        )}

        {/* Editor modal */}
        {showEditor && (
          <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Edit Instructions">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Edit Instructions</h3>
                <button className={styles.iconBtn} onClick={this.closeEditor} disabled={saving} aria-label="Close">
                  ✖
                </button>
              </div>
              <div className={styles.modalBody}>
                <textarea
                  value={draft}
                  onChange={this.onDraftChange}
                  className={styles.textarea}
                  placeholder="Write instructions for this chapter..."
                />
                {error && <div className={styles.error}>{error}</div>}
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btn} onClick={this.closeEditor} disabled={saving}>Cancel</button>
                <button className={classNames(styles.btn, styles.primary)} onClick={this.save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Instructions;