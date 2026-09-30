import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { compose } from "redux";
import Box from "../box/box";
import SB3Downloader from "../../containers/sb3-downloader.jsx";
import DeletionRestorer from "../../containers/deletion-restorer.jsx";
import TurboMode from "../../containers/turbo-mode.jsx";
import menuBarStyles from "../menu-bar/menu-bar.css";

import classNames from "classnames";

import CrossIcon from "./icon--cross.svg";
import HamBurgerIcon from "./icon--hamburger.svg";
import fileIcon from "../menu-bar/icon--file.svg";
import dropdownCaret from "../menu-bar/dropdown-caret.svg";
import editIcon from "../menu-bar/icon--edit.svg";

import SettingsMenu from "../menu-bar/settings-menu";
import { MenuItem, MenuSection } from "../menu/menu.jsx";
import MenuBarMenu from "../menu-bar/menu-bar-menu.jsx";
import MenuBarHOC from "../../containers/menu-bar-hoc.jsx";

import helpIcon from "../../lib/assets/icon--tutorials.svg";


import bindAll from "lodash.bindall";
import sharedMessages from "../../lib/shared-messages";

import styles from "./side-bar.css";
import { openTipsLibrary } from "../../reducers/modals";

import {
    defineMessages,
    FormattedMessage,
    injectIntl,
    intlShape,
} from "react-intl";
import {
    openSettingsMenu,
    closeSettingsMenu,
    settingsMenuOpen,
    fileMenuOpen,
    openFileMenu,
    closeFileMenu,
    editMenuOpen,
    openEditMenu,
    modeMenuOpen,
    closeEditMenu,
} from "../../reducers/menus";
import {
    autoUpdateProject,
    getIsShowingProject,
    getIsUpdating,
    manualUpdateProject,
    remixProject,
    requestNewProject,
    saveProjectAsCopy,
} from "../../reducers/project-state";
import {
    isTimeTravel1920,
    isTimeTravel1990,
    isTimeTravel2020,
    isTimeTravel220022BC,
    isTimeTravelNow,
    setTimeTravel,
} from "../../reducers/time-travel";

const ariaMessages = defineMessages({
    tutorials: {
        id: "gui.menuBar.tutorialsLibrary",
        defaultMessage: "Tutorials",
        description: "accessibility text for the tutorials button",
    },
});

class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDrawerOpen: false,
        };
        bindAll(this, [
            "handleDrawerOpen",
            "handleDrawerClose",
            "handleClickNew",
            "handleClickRemix",
            "handleClickSave",
            "handleClickSaveAsCopy",
            // "handleClickSeeCommunity",
            // "handleClickShare",
            "handleSetMode",
            // "handleKeyPress",
            "handleRestoreOption",
            "getSaveToComputerHandler",
            "restoreOptionMessage",
        ]);
    }
    handleDrawerOpen() {
        this.setState({ isDrawerOpen: true });
    }
    handleDrawerClose() {
        this.setState({ isDrawerOpen: false });
    }
    handleClickNew() {
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
        );
        this.props.onRequestCloseFile();
        if (readyToReplaceProject) {
            this.props.onClickNew(
                this.props.canSave && this.props.canCreateNew
            );
        }
        this.props.onRequestCloseFile();
    }
    handleClickRemix() {
        this.props.onClickRemix();
        this.props.onRequestCloseFile();
    }
    handleClickSave() {
        this.props.onClickSave();
        this.props.onRequestCloseFile();
    }
    handleClickSaveAsCopy() {
        this.props.onClickSaveAsCopy();
        this.props.onRequestCloseFile();
    }
    handleRestoreOption(restoreFun) {
        return () => {
            restoreFun();
            this.props.onRequestCloseEdit();
        };
    }
    getSaveToComputerHandler(downloadProjectCallback) {
        return () => {
            this.props.onRequestCloseFile();
            downloadProjectCallback();
            if (this.props.onProjectTelemetryEvent) {
                const metadata = collectMetadata(
                    this.props.vm,
                    this.props.projectTitle,
                    this.props.locale
                );
                this.props.onProjectTelemetryEvent("projectDidSave", metadata);
            }
        };
    }
    restoreOptionMessage(deletedItem) {
        switch (deletedItem) {
            case "Sprite":
                return (
                    <FormattedMessage
                        defaultMessage="Restore Sprite"
                        description="Menu bar item for restoring the last deleted sprite."
                        id="gui.menuBar.restoreSprite"
                    />
                );
            case "Sound":
                return (
                    <FormattedMessage
                        defaultMessage="Restore Sound"
                        description="Menu bar item for restoring the last deleted sound."
                        id="gui.menuBar.restoreSound"
                    />
                );
            case "Costume":
                return (
                    <FormattedMessage
                        defaultMessage="Restore Costume"
                        description="Menu bar item for restoring the last deleted costume."
                        id="gui.menuBar.restoreCostume"
                    />
                );
            default: {
                return (
                    <FormattedMessage
                        defaultMessage="Restore"
                        description="Menu bar item for restoring the last deleted item in its disabled state." /* eslint-disable-line max-len */
                        id="gui.menuBar.restore"
                    />
                );
            }
        }
    }
    handleSetMode(mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === "1920") {
                document.documentElement.style.filter =
                    "brightness(.9)contrast(.8)sepia(1.0)";
                document.documentElement.style.height = "100%";
            } else if (mode === "1990") {
                document.documentElement.style.filter = "hue-rotate(40deg)";
                document.documentElement.style.height = "100%";
            } else {
                document.documentElement.style.filter = "";
                document.documentElement.style.height = "";
            }

            // Change logo for modes
            if (mode === "1990") {
                document.getElementById("logo_img").src = ninetiesLogo;
            } else if (mode === "2020") {
                document.getElementById("logo_img").src = catLogo;
            } else if (mode === "1920") {
                document.getElementById("logo_img").src = oldtimeyLogo;
            } else if (mode === "220022BC") {
                document.getElementById("logo_img").src = prehistoricLogo;
            } else {
                document.getElementById("logo_img").src = this.props.logo;
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    render() {
        const { isDrawerOpen } = this.state;

        const saveNowMessage = (
            <FormattedMessage
                defaultMessage="Save now"
                description="Menu bar item for saving now"
                id="gui.menuBar.saveNow"
            />
        );
        const createCopyMessage = (
            <FormattedMessage
                defaultMessage="Save as a copy"
                description="Menu bar item for saving as a copy"
                id="gui.menuBar.saveAsCopy"
            />
        );
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const newProjectMessage = (
            <FormattedMessage
                defaultMessage="New"
                description="Menu bar item for creating a new project"
                id="gui.menuBar.new"
            />
        );

        return (
            <>
                <Box className={styles.sidemenubar}>
                    <div className={styles.hamburger}>
                        {!isDrawerOpen && (
                            <Box
                                onClick={this.handleDrawerOpen}
                                style={{
                                    cursor: "pointer",
                                }}
                            >
                                <img src={HamBurgerIcon} alt="Menu" />
                            </Box>
                        )}
                    </div>
                </Box>
                {isDrawerOpen && (
                    <Box
                        style={{
                            width: "35%",
                            height: "100vh",
                            backgroundColor: "#855cd6",
                            padding: "10px 10px",
                            transition: "width 0.3s ease",
                            boxSizing: "border-box",
                            position: "fixed",
                            top: "0",
                            left: "0",
                            zIndex: "492",
                            border: "none",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Box
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <Box
                                onClick={this.handleDrawerClose}
                                style={{
                                    cursor: "pointer",
                                    padding: "10px",
                                }}
                            >
                                <img src={CrossIcon} alt="Close" />
                            </Box>
                        </Box>

                        <Box>
                            <div>
                                <div>
                                    {(this.props.canChangeTheme ||
                                        this.props.canChangeLanguage) && (
                                        <SettingsMenu
                                            canChangeLanguage={
                                                this.props.canChangeLanguage
                                            }
                                            canChangeTheme={
                                                this.props.canChangeTheme
                                            }
                                            isRtl={this.props.isRtl}
                                            onRequestClose={
                                                this.props
                                                    .onRequestCloseSettings
                                            }
                                            onRequestOpen={
                                                this.props.onClickSettings
                                            }
                                            settingsMenuOpen={
                                                this.props.settingsMenuOpen
                                            }
                                        />
                                    )}
                                </div>
                                <div>
                                    {/* 3. file section in the menu bar */}
                                    {this.props.canManageFiles && (
                                        <div
                                            className={classNames(
                                                menuBarStyles.menuBarItem,
                                                menuBarStyles.hoverable,
                                                menuBarStyles.themeMenu,
                                                {
                                                    [menuBarStyles.active]:
                                                        this.props.fileMenuOpen,
                                                }
                                            )}
                                            onMouseUp={this.props.onClickFile}
                                        >
                                            <img src={fileIcon} />
                                            <span
                                                className={styles.dropdownLabel}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="File"
                                                    description="Text for file dropdown menu"
                                                    id="gui.menuBar.file"
                                                />
                                            </span>
                                            <img src={dropdownCaret} />

                                            {/* drop-down menu starts here */}
                                            <MenuBarMenu
                                                className={classNames(
                                                    styles.menuBarMenu
                                                )}
                                                open={this.props.fileMenuOpen}
                                                place={
                                                    this.props.isRtl
                                                        ? "left"
                                                        : "right"
                                                }
                                                onRequestClose={
                                                    this.props
                                                        .onRequestCloseFile
                                                }
                                            >
                                                <MenuSection>
                                                    {/* 3.1 "New" drop-down menu */}
                                                    <MenuItem
                                                        isRtl={this.props.isRtl}
                                                        onClick={
                                                            this.handleClickNew
                                                        }
                                                    >
                                                        {newProjectMessage}
                                                    </MenuItem>
                                                </MenuSection>

                                                {/* conditional drop-downs menus namely: "Save now", "Save as a copy", "Remix"*/}
                                                {(this.props.canSave ||
                                                    this.props.canCreateCopy ||
                                                    this.props.canRemix) && (
                                                    <MenuSection>
                                                        {this.props.canSave && (
                                                            <MenuItem
                                                                onClick={
                                                                    this
                                                                        .handleClickSave
                                                                }
                                                            >
                                                                {saveNowMessage}
                                                            </MenuItem>
                                                        )}
                                                        {this.props
                                                            .canCreateCopy && (
                                                            <MenuItem
                                                                onClick={
                                                                    this
                                                                        .handleClickSaveAsCopy
                                                                }
                                                            >
                                                                {
                                                                    createCopyMessage
                                                                }
                                                            </MenuItem>
                                                        )}
                                                        {this.props
                                                            .canRemix && (
                                                            <MenuItem
                                                                onClick={
                                                                    this
                                                                        .handleClickRemix
                                                                }
                                                            >
                                                                {remixMessage}
                                                            </MenuItem>
                                                        )}
                                                    </MenuSection>
                                                )}

                                                <MenuSection>
                                                    {/* 3.2 "Load from your computer" drop-down menu */}
                                                    <MenuItem
                                                        onClick={
                                                            this.props
                                                                .onStartSelectingFileUpload
                                                        }
                                                    >
                                                        {this.props.intl.formatMessage(
                                                            sharedMessages.loadFromComputerTitle
                                                        )}
                                                    </MenuItem>

                                                    {/* 3.3 "Save to your computer" drop-down menu */}
                                                    <SB3Downloader>
                                                        {(
                                                            className,
                                                            downloadProjectCallback
                                                        ) => (
                                                            <MenuItem
                                                                className={
                                                                    className
                                                                }
                                                                onClick={this.getSaveToComputerHandler(
                                                                    downloadProjectCallback
                                                                )}
                                                            >
                                                                <FormattedMessage
                                                                    defaultMessage="Save to your computer"
                                                                    description="Menu bar item for downloading a project to your computer" // eslint-disable-line max-len
                                                                    id="gui.menuBar.downloadToComputer"
                                                                />
                                                            </MenuItem>
                                                        )}
                                                    </SB3Downloader>
                                                </MenuSection>
                                            </MenuBarMenu>
                                        </div>
                                    )}
                                </div>
                                {/* 4. edit section in the menu bar */}
                                <div
                                    className={classNames(
                                        menuBarStyles.menuBarItem,
                                        menuBarStyles.hoverable,
                                        menuBarStyles.themeMenu,
                                        {
                                            [menuBarStyles.active]:
                                                this.props.editMenuOpen,
                                        }
                                    )}
                                    onMouseUp={this.props.onClickEdit}
                                >
                                    <img src={editIcon} />
                                    <span className={styles.dropdownLabel}>
                                        <FormattedMessage
                                            defaultMessage="Edit"
                                            description="Text for edit dropdown menu"
                                            id="gui.menuBar.edit"
                                        />
                                    </span>
                                    <img src={dropdownCaret} />
                                    <MenuBarMenu
                                        className={classNames(
                                            styles.menuBarMenu
                                        )}
                                        open={this.props.editMenuOpen}
                                        place={
                                            this.props.isRtl ? "left" : "right"
                                        }
                                        onRequestClose={
                                            this.props.onRequestCloseEdit
                                        }
                                    >
                                        <DeletionRestorer>
                                            {(
                                                handleRestore,
                                                { restorable, deletedItem }
                                            ) => (
                                                <MenuItem
                                                    className={classNames({
                                                        [styles.disabled]:
                                                            !restorable,
                                                    })}
                                                    onClick={this.handleRestoreOption(
                                                        handleRestore
                                                    )}
                                                >
                                                    {this.restoreOptionMessage(
                                                        deletedItem
                                                    )}
                                                </MenuItem>
                                            )}
                                        </DeletionRestorer>
                                        <MenuSection>
                                            <TurboMode>
                                                {(
                                                    toggleTurboMode,
                                                    { turboMode }
                                                ) => (
                                                    <MenuItem
                                                        onClick={
                                                            toggleTurboMode
                                                        }
                                                    >
                                                        {turboMode ? (
                                                            <FormattedMessage
                                                                defaultMessage="Turn off Turbo Mode"
                                                                description="Menu bar item for turning off turbo mode"
                                                                id="gui.menuBar.turboModeOff"
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                defaultMessage="Turn on Turbo Mode"
                                                                description="Menu bar item for turning on turbo mode"
                                                                id="gui.menuBar.turboModeOn"
                                                            />
                                                        )}
                                                    </MenuItem>
                                                )}
                                            </TurboMode>
                                        </MenuSection>
                                    </MenuBarMenu>
                                </div>

                                {/* conditional rendering of another section in menu bar called: "Mode".
                                        two drop-down menus: "Normal mode", "Caturday mode" */}
                                {this.props.isTotallyNormal && (
                                    <div
                                        className={classNames(
                                            styles.sidebarItem,
                                            styles.hoverable,
                                            {
                                                [styles.active]:
                                                    this.props.modeMenuOpen,
                                            }
                                        )}
                                        onMouseUp={this.props.onClickMode}
                                    >
                                        <div
                                            className={classNames(
                                                styles.editMenu
                                            )}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Mode"
                                                description="Mode menu item in the menu bar"
                                                id="gui.menuBar.modeMenu"
                                            />
                                        </div>
                                        <MenuBarMenu
                                            className={classNames(
                                                styles.menuBarMenu
                                            )}
                                            open={this.props.modeMenuOpen}
                                            place={
                                                this.props.isRtl
                                                    ? "left"
                                                    : "right"
                                            }
                                            onRequestClose={
                                                this.props.onRequestCloseMode
                                            }
                                        >
                                            <MenuSection>
                                                <MenuItem
                                                    onClick={this.handleSetMode(
                                                        "NOW"
                                                    )}
                                                >
                                                    <span
                                                        className={classNames({
                                                            [styles.inactive]:
                                                                !this.props
                                                                    .modeNow,
                                                        })}
                                                    >
                                                        {"✓"}
                                                    </span>{" "}
                                                    <FormattedMessage
                                                        defaultMessage="Normal mode"
                                                        description="April fools: resets editor to not have any pranks"
                                                        id="gui.menuBar.normalMode"
                                                    />
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={this.handleSetMode(
                                                        "2020"
                                                    )}
                                                >
                                                    <span
                                                        className={classNames({
                                                            [styles.inactive]:
                                                                !this.props
                                                                    .mode2020,
                                                        })}
                                                    >
                                                        {"✓"}
                                                    </span>{" "}
                                                    <FormattedMessage
                                                        defaultMessage="Caturday mode"
                                                        description="April fools: Cat blocks mode"
                                                        id="gui.menuBar.caturdayMode"
                                                    />
                                                </MenuItem>
                                            </MenuSection>
                                        </MenuBarMenu>
                                    </div>
                                )}


                                {/* tutorials section on menu bar */}
                                <div className={styles.fileGroup}>
                                    <div
                                        aria-label={this.props.intl.formatMessage(
                                            ariaMessages.tutorials
                                        )}
                                        className={classNames(
                                            menuBarStyles.menuBarItem,
                                            menuBarStyles.hoverable,
                                            styles.hideable
                                        )}
                                        onClick={this.props.onOpenTipLibrary}
                                    >
                                        <img
                                            className={styles.helpIcon}
                                            src={helpIcon}
                                        />
                                        <span className={styles.tutorialsLabel}>
                                            <FormattedMessage
                                                {...ariaMessages.tutorials}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Box>
                    </Box>
                )}
            </>
        );
    }
}

SideBar.propTypes = {
    onClickSettings: PropTypes.func,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    onRequestCloseSettings: PropTypes.func,
    settingsMenuOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    fileMenuOpen: PropTypes.bool,
    onClickFile: PropTypes.func,
    onClickEdit: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    canCreateCopy: PropTypes.bool,
    canRemix: PropTypes.bool,
    onClickNew: PropTypes.func,
    canSave: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    onStartSelectingFileUpload: PropTypes.func,
    confirmReadyToReplaceProject: PropTypes.func,
    intl: intlShape,
    editMenuOpen: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    modeMenuOpen: PropTypes.bool,
    onRequestCloseMode: PropTypes.func,
    mode1920: PropTypes.bool,
    mode1990: PropTypes.bool,
    mode2020: PropTypes.bool,
    mode220022BC: PropTypes.bool,
    modeNow: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user =
        state.session && state.session.session && state.session.session.user;
    return {
        settingsMenuOpen: settingsMenuOpen(state),
        isRtl: state.locales.isRtl,
        fileMenuOpen: fileMenuOpen(state),
        editMenuOpen: editMenuOpen(state),
        modeMenuOpen: modeMenuOpen(state),
        mode220022BC: isTimeTravel220022BC(state),
        mode1920: isTimeTravel1920(state),
        mode1990: isTimeTravel1990(state),
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state),
    };
};

const mapDispatchToProps = (dispatch) => ({
    onClickSettings: () => dispatch(openSettingsMenu()),
    onRequestCloseSettings: () => dispatch(closeSettingsMenu()),
    onClickFile: () => dispatch(openFileMenu()),
    onRequestCloseFile: () => dispatch(closeFileMenu()),
    onRequestCloseEdit: () => dispatch(closeEditMenu()),
    onClickNew: (needSave) => dispatch(requestNewProject(needSave)),
    onClickEdit: () => dispatch(openEditMenu()),
    onRequestCloseMode: () => dispatch(closeModeMenu()),
    onOpenTipLibrary: () => dispatch(openTipsLibrary()),

});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(mapStateToProps, mapDispatchToProps)
)(SideBar);
