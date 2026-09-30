import classNames from "classnames";
import omit from "lodash.omit";
import PropTypes from "prop-types";
import React from "react";
import {
    defineMessages,
    FormattedMessage,
    injectIntl,
    intlShape,
} from "react-intl";
import { connect } from "react-redux";
import MediaQuery from "react-responsive";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import tabStyles from "react-tabs/style/react-tabs.css";
import Renderer from "scratch-render";
import VM from "scratch-vm";

import BackdropLibrary from "../../containers/backdrop-library.jsx";
import Blocks from "../../containers/blocks.jsx";
import CostumeTab from "../../containers/costume-tab.jsx";
import SoundTab from "../../containers/sound-tab.jsx";
import StageWrapper from "../../containers/stage-wrapper.jsx";
import StageWrapperNew from "../../containers/stage-wrapper-new.jsx";
import TargetPane from "../../containers/target-pane.jsx";
import Watermark from "../../containers/watermark.jsx";
import Box from "../box/box.jsx";
import Loader from "../loader/loader.jsx";
import MenuBar from "../menu-bar/menu-bar.jsx";

import Alerts from "../../containers/alerts.jsx";
import Backpack from "../../containers/backpack.jsx";
import Cards from "../../containers/cards.jsx";
import ConnectionModal from "../../containers/connection-modal.jsx";
import DragLayer from "../../containers/drag-layer.jsx";
import TipsLibrary from "../../containers/tips-library.jsx";
import WebGlModal from "../../containers/webgl-modal.jsx";
import TelemetryModal from "../telemetry-modal/telemetry-modal.jsx";

import layout, { STAGE_SIZE_MODES } from "../../lib/layout-constants.js";
import { resolveStageSize } from "../../lib/screen-utils.js";
import { themeMap } from "../../lib/themes/index.js";

// import { flex } from 'to-style/src/prefixProperties.js';
import BackToTopButton from "../../Integration/BackToTopButton.jsx";
import Divider from "../divider/divider.jsx";
 import Instructions from "../../containers/instructions.jsx";
import styles from "./gui.css";
import codeIcon from "./icon--code.svg";
import costumesIcon from "./icon--costumes.svg";
import addExtensionIcon from "./icon--extensions.svg";
import soundsIcon from "./icon--sounds.svg";
// import showStageWrapper from "./icon--show-stagewrapper.svg";
import Up from "./icon--up.svg";
import Down from "./icon--down.svg";
import showStageWrapper from "./icon--stagewrapper-flag.svg";
import hideStageWrapper from "./icon--hide-stagewrapper.svg";
import Cross from "./icon--cross.svg";

const messages = defineMessages({
    addExtension: {
        id: "gui.gui.addExtension",
        description: "Button to add an extension in the target pane",
        defaultMessage: "Add Extension",
    },
});
import { useState, useEffect, useRef } from "react";

// Cache this value to only retrieve it once the first time.
// Assume that it doesn't change for a session.
let isRendererSupported = null;

const GUIComponent = (props) => {
    const {
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        cardsVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        costumesTabVisible,
        enableCommunity,
        intl,
        isCreating,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isTelemetryEnabled,
        isTotallyNormal,
        loading,
        logo,
        renderLogin,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onLogOut,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateCostumesTab,
        onActivateSoundsTab,
        // onActivateStageTab,
        onActivateTab,
        onClickLogo,
        onExtensionButtonClick,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        showComingSoon,
        soundsTabVisible,
        // stageTabVisible,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        tipsLibraryVisible,
        vm,
        mobileView,
        orientation,
        showStage,
        handleShowStageWrapper,
        handleCloseStageWrapper,
        ...componentProps
    } = omit(props, "dispatch");
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }
    console.log("showStage:", showStage);

    const tabClassNames = {
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(
            tabStyles.reactTabsTabPanelSelected,
            styles.isSelected
        ),
        tabSelected: classNames(
            tabStyles.reactTabsTabSelected,
            styles.isSelected
        ),
    };

    if (isRendererSupported === null) {
        isRendererSupported = Renderer.isSupported();
    }

    // // Step 1: Initialize state for the block visibility
    // const [showStage, setShowStage] = useState(false);
    const [showMenuBar, setShowMenuBar] = useState(true);

    // Step 2: Function to show the menubar (set setShowMenuBar to true)
    const handleShowMenubar = () => {
        setShowMenuBar(true);
    };

    // Step 3: Function to hide the menubar (set showStage to false)
    const handleHideMenubar = () => {
        setShowMenuBar(false);
    };

    const tabPanelRef = useRef(null);
    const stageRef = useRef(null);

    useEffect(() => {
        if (showStage && tabPanelRef.current && stageRef.current) {
            const tabPanelHeight = tabPanelRef.current.clientHeight;
            stageRef.current.style.height = `${tabPanelHeight}px`;
        }
    }, [showStage]);

    useEffect(() => {
        // Close the stage wrapper when switching tabs
        if (activeTabIndex !== 0 && showStage) {
            handleCloseStageWrapper();
        }
    }, [activeTabIndex, showStage, handleCloseStageWrapper]);

    const baseProps = {
        isFullScreen,
        isRendererSupported,
        isRtl,
        vm
    };

    return (
        <MediaQuery minWidth={layout.fullSizeMinWidth}>
            {(isFullSize) => { 
                const stageSize = resolveStageSize(stageSizeMode, isFullSize);

                return isPlayerOnly ? (
                    <StageWrapper
                        isFullScreen={isFullScreen}
                        isRendererSupported={isRendererSupported}
                        isRtl={isRtl}
                        loading={loading}
                        stageSize={STAGE_SIZE_MODES.large}
                        vm={vm}
                    >
                        {alertsVisible ? (
                            <Alerts className={styles.alertsContainer} />
                        ) : null}
                    </StageWrapper>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            width: "100%", 
                            height: "100vh",
                            position: "relative", 
                            overflowX: "hidden", // Prevent horizontal scroll
                            overflowY: "auto", // Allow vertical scroll
                        }}
                    >
                        <div 
                        style={{ 
                            flex: "3", 
                        }}
                        >
                            <Box
                                className={styles.pageWrapper}
                                dir={isRtl ? "rtl" : "ltr"}
                                {...componentProps}
                            >
                                {telemetryModalVisible ? (
                                    <TelemetryModal
                                        isRtl={isRtl}
                                        isTelemetryEnabled={isTelemetryEnabled}
                                        onCancel={onTelemetryModalCancel}
                                        onOptIn={onTelemetryModalOptIn}
                                        onOptOut={onTelemetryModalOptOut}
                                        onRequestClose={
                                            onRequestCloseTelemetryModal
                                        }
                                        onShowPrivacyPolicy={
                                            onShowPrivacyPolicy
                                        }
                                    />
                                ) : null}
                                {loading ? <Loader /> : null}
                                {isCreating ? (
                                    <Loader messageId="gui.loader.creating" />
                                ) : null}
                                {isRendererSupported ? null : (
                                    <WebGlModal isRtl={isRtl} />
                                )}
                                {tipsLibraryVisible ? <TipsLibrary /> : null}
                                {cardsVisible ? <Cards /> : null}
                                {alertsVisible ? (
                                    <Alerts
                                        className={styles.alertsContainer}
                                    />
                                ) : null}
                                {connectionModalVisible ? (
                                    <ConnectionModal vm={vm} />
                                ) : null}
                                {costumeLibraryVisible ? (
                                    <CostumeLibrary
                                        vm={vm}
                                        onRequestClose={
                                            onRequestCloseCostumeLibrary
                                        }
                                    />
                                ) : null}
                                {backdropLibraryVisible ? (
                                    <BackdropLibrary
                                        vm={vm}
                                        onRequestClose={
                                            onRequestCloseBackdropLibrary
                                        }
                                    />
                                ) : null}
                                {showMenuBar && (
                                    <MenuBar
                                        accountNavOpen={accountNavOpen}
                                        authorId={authorId}
                                        authorThumbnailUrl={authorThumbnailUrl}
                                        authorUsername={authorUsername}
                                        canChangeLanguage={canChangeLanguage}
                                        canChangeTheme={canChangeTheme}
                                        canCreateCopy={canCreateCopy}
                                        canCreateNew={canCreateNew}
                                        canEditTitle={canEditTitle}
                                        canManageFiles={canManageFiles}
                                        canRemix={canRemix}
                                        canSave={canSave}
                                        canShare={canShare}
                                        className={styles.menuBarPosition}
                                        enableCommunity={enableCommunity}
                                        isShared={isShared}
                                        isTotallyNormal={isTotallyNormal}
                                        logo={logo}
                                        renderLogin={renderLogin}
                                        showComingSoon={showComingSoon}
                                        onClickAbout={onClickAbout}
                                        onClickAccountNav={onClickAccountNav}
                                        onClickLogo={onClickLogo}
                                        onCloseAccountNav={onCloseAccountNav}
                                        onLogOut={onLogOut}
                                        onOpenRegistration={onOpenRegistration}
                                        onProjectTelemetryEvent={
                                            onProjectTelemetryEvent
                                        }
                                        onSeeCommunity={onSeeCommunity}
                                        onShare={onShare}
                                        onStartSelectingFileUpload={
                                            onStartSelectingFileUpload
                                        }
                                        onToggleLoginOpen={onToggleLoginOpen}
                                    />
                                )}
                                {/* <Instructions /> */}
                                {/* <div className="instructionswrapper"  style={{ display: 'flex', justifyContent: 'space-between'}}> */}
                                {/* <div className={styles.instructionswrapper}>
                                    <Instructions />
                                    <div className={styles.menutogglebuttons}>
                                        {showMenuBar ? (
                                            <button
                                                className={
                                                    styles.hideandmenubar
                                                }
                                                onClick={handleHideMenubar}
                                            >
                                                <img
                                                    draggable={false}
                                                    src={Up}
                                                    alt="Hide Menu"
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                className={
                                                    styles.hideandmenubar
                                                }
                                                onClick={handleShowMenubar}
                                            >
                                                <img
                                                    draggable={false}
                                                    src={Down}
                                                    alt="Show Menu"
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div> */}

                                {/* )} */}
                                <Box className={styles.bodyWrapper}>
                                    <Box className={styles.flexWrapper}>
                                        <Box className={styles.editorWrapper}>
                                            <Tabs
                                                forceRenderTabPanel
                                                className={tabClassNames.tabs}
                                                selectedIndex={activeTabIndex}
                                                selectedTabClassName={
                                                    tabClassNames.tabSelected
                                                }
                                                selectedTabPanelClassName={
                                                    tabClassNames.tabPanelSelected
                                                }
                                                onSelect={onActivateTab}
                                            >
                                                <TabList
                                                    className={
                                                        tabClassNames.tabList
                                                    }
                                                >
                                                    <Tab
                                                        className={
                                                            tabClassNames.tab
                                                        }
                                                    >
                                                        <img
                                                            draggable={false}
                                                            src={codeIcon}
                                                        />
                                                        <FormattedMessage
                                                            defaultMessage="Code"
                                                            description="Button to get to the code panel"
                                                            id="gui.gui.codeTab"
                                                        />
                                                    </Tab>
                                                    <Tab
                                                        className={
                                                            tabClassNames.tab
                                                        }
                                                        onClick={
                                                            onActivateCostumesTab
                                                        }
                                                    >
                                                        <img
                                                            draggable={false}
                                                            src={costumesIcon}
                                                        />
                                                        {targetIsStage ? (
                                                            <FormattedMessage
                                                                defaultMessage="Backdrops"
                                                                description="Button to get to the backdrops panel"
                                                                id="gui.gui.backdropsTab"
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                defaultMessage="Costumes"
                                                                description="Button to get to the costumes panel"
                                                                id="gui.gui.costumesTab"
                                                            />
                                                        )}
                                                    </Tab>
                                                    <Tab
                                                        className={
                                                            tabClassNames.tab
                                                        }
                                                        onClick={
                                                            onActivateSoundsTab
                                                        }
                                                    >
                                                        <img
                                                            draggable={false}
                                                            src={soundsIcon}
                                                        />
                                                        <FormattedMessage
                                                            defaultMessage="Sounds"
                                                            description="Button to get to the sounds panel"
                                                            id="gui.gui.soundsTab"
                                                        />
                                                    </Tab>
                                                    {mobileView &&
                                                    orientation ===
                                                        "landscape" ? (
                                                        <Tab
                                                            className={
                                                                tabClassNames.tab
                                                            }
                                                            // onClick={
                                                            //     onActivateStageTab
                                                            // }
                                                        >
                                                            <img
                                                                draggable={
                                                                    false
                                                                }
                                                                src={soundsIcon}
                                                            />
                                                            <FormattedMessage
                                                                defaultMessage="Stage"
                                                                description="Button to get to the sounds panel"
                                                                id="gui.gui.soundsTabsss"
                                                            />
                                                        </Tab>
                                                    ) : null}
                                                </TabList>
                                                {/*  */}
                                                <TabPanel
                                                    ref={tabPanelRef}
                                                    className={
                                                        tabClassNames.tabPanel
                                                    }
                                                >
                                                    {/*  */}
                                                    <Box
                                                        className={
                                                            styles.blocksWrapper
                                                        }
                                                    >
                                                        <Blocks
                                                            key={`${blocksId}/${theme}`}
                                                            canUseCloud={
                                                                canUseCloud
                                                            }
                                                            grow={1}
                                                            isVisible={
                                                                blocksTabVisible
                                                            }
                                                            options={{
                                                                media: `${basePath}static/${themeMap[theme].blocksMediaFolder}/`,
                                                            }}
                                                            stageSize={
                                                                stageSize
                                                            }
                                                            theme={theme}
                                                            vm={vm}
                                                        />
                                                    </Box>
                                                    <Box
                                                        className={
                                                            styles.extensionButtonContainer
                                                        }
                                                    >
                                                        <button
                                                            className={
                                                                styles.extensionButton
                                                            }
                                                            title={intl.formatMessage(
                                                                messages.addExtension
                                                            )}
                                                            onClick={
                                                                onExtensionButtonClick
                                                            }
                                                        >
                                                            <img
                                                                className={
                                                                    styles.extensionButtonIcon
                                                                }
                                                                draggable={
                                                                    false
                                                                }
                                                                src={
                                                                    addExtensionIcon
                                                                }
                                                            />
                                                        </button>
                                                    </Box>
                                                    {mobileView && (
                                                        <Box
                                                            className={
                                                                styles.showstagebuttoncontainer
                                                            }
                                                        >
                                                            {/* {showStage ? (
                                                                <button
                                                                    className={
                                                                        styles.hidestagebutton
                                                                    }
                                                                    onClick={
                                                                        handleCloseStageWrapper
                                                                    }
                                                                >
                                                                    <img
                                                                        className={
                                                                            styles.hidestagewrapperbutton
                                                                        }
                                                                        draggable={
                                                                            false
                                                                        }
                                                                        src={
                                                                            hideStageWrapper
                                                                        } // Image for hiding stage
                                                                    />
                                                                </button>
                                                            ) : ( */}
                                                            <button
                                                                className={
                                                                    styles.showstagebutton
                                                                }
                                                                onClick={
                                                                    handleShowStageWrapper
                                                                }
                                                            >
                                                                <img
                                                                    className={
                                                                        styles.showstagewrapperbutton
                                                                    }
                                                                    draggable={
                                                                        false
                                                                    }
                                                                    src={
                                                                        showStageWrapper
                                                                    }
                                                                />
                                                            </button>
                                                            {/* )} */}
                                                        </Box>
                                                    )}
                                                    <Box
                                                        className={
                                                            styles.watermark
                                                        }
                                                    >
                                                        <Watermark />
                                                    </Box>
                                                </TabPanel>
                                                <TabPanel
                                                    className={
                                                        tabClassNames.tabPanel
                                                    }
                                                >
                                                    {costumesTabVisible ? (
                                                        <CostumeTab vm={vm} />
                                                    ) : null}
                                                </TabPanel>
                                                <TabPanel
                                                    className={
                                                        tabClassNames.tabPanel
                                                    }
                                                >
                                                    {soundsTabVisible ? (
                                                        <SoundTab vm={vm} />
                                                    ) : null}
                                                </TabPanel>

                                                <TabPanel
                                                    className={
                                                        tabClassNames.tabPanel
                                                    }
                                                >
                                                    {mobileView &&
                                                    orientation ===
                                                        "landscape" &&
                                                    !showStage ? (
                                                        <Box
                                                            className={
                                                                styles.outerWrapper
                                                            }
                                                        >
                                                            <Box
                                                                className={
                                                                    styles.targetWrapper1
                                                                }
                                                            >
                                                                <TargetPane
                                                                    stageSize={
                                                                        stageSize
                                                                    }
                                                                    vm={vm}
                                                                />
                                                            </Box>
                                                            <Divider
                                                                className={
                                                                    styles.divider
                                                                }
                                                            />
                                                            <Box
                                                                className={
                                                                    styles.stagewrappernew
                                                                }
                                                            >
                                                                <StageWrapperNew
                                                                    isFullScreen={
                                                                        isFullScreen
                                                                    }
                                                                    isRendererSupported={
                                                                        isRendererSupported
                                                                    }
                                                                    isRtl={
                                                                        isRtl
                                                                    }
                                                                    stageSize={
                                                                        STAGE_SIZE_MODES.small
                                                                    }
                                                                    vm={vm}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    ) : null}
                                                </TabPanel>
                                            </Tabs>
                                            {backpackVisible ? (
                                                <Backpack host={backpackHost} />
                                            ) : null}
                                        </Box>

                                        {/* Conditional rendering of StageWrapper when showStage is true */}
                                        {showStage && (
                                            <Box className={styles.outerBox}>
                                                <div
                                                    className={
                                                        styles.outerBoxPadding
                                                    }
                                                >
                                                    <Box
                                                        className={classNames(
                                                            styles.stageOnly,
                                                            styles[stageSize]
                                                        )}
                                                    >
                                                        <StageWrapperNew
                                                            isFullScreen={
                                                                isFullScreen
                                                            }
                                                            isRendererSupported={
                                                                isRendererSupported
                                                            }
                                                            isRtl={isRtl}
                                                            stageSize={
                                                                STAGE_SIZE_MODES.small
                                                            }
                                                            vm={vm}
                                                        />
                                                    </Box>
                                                    <button
                                                        className={
                                                            styles.hidestagebutton
                                                        }
                                                        onClick={
                                                            handleCloseStageWrapper
                                                        }
                                                    >
                                                        <img
                                                            className={
                                                                styles.hidestagewrapperbutton
                                                            }
                                                            draggable={false}
                                                            src={Cross}
                                                        />
                                                    </button>
                                                </div>
                                            </Box>
                                        )}
                                        {!mobileView ? (
                                            <Box
                                                className={classNames(
                                                    styles.stageAndTargetWrapper,
                                                    styles[stageSize]
                                                )}
                                            >
                                                <StageWrapper
                                                    isFullScreen={isFullScreen}
                                                    isRendererSupported={
                                                        isRendererSupported
                                                    }
                                                    isRtl={isRtl}
                                                    stageSize={stageSize}
                                                    vm={vm}
                                                />
                                                <Box
                                                    className={
                                                        styles.targetWrapper
                                                    }
                                                >
                                                    <TargetPane
                                                        stageSize={stageSize}
                                                        vm={vm}
                                                    />
                                                </Box>
                                            </Box>
                                        ) : null}
                                    </Box>
                                    {/* <BackToTopButton /> */}
                                </Box>
                                <DragLayer />
                            </Box>
                        </div>
                    </div>
                );
            }}
        </MediaQuery>
    );
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]), // can be false
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]), // can be false
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    cardsVisible: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateCostumesTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    // onActivateStageTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickLogo: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    renderLogin: PropTypes.func,
    showComingSoon: PropTypes.bool,
    soundsTabVisible: PropTypes.bool,
    // stageTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.string,
    tipsLibraryVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
};
GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: "./",
    blocksId: "original",
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    isTotallyNormal: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
    stageSizeMode: STAGE_SIZE_MODES.largeConstrained,
};

const mapStateToProps = (state) => {
    const blocksId = state.scratchGui.timeTravel.year.toString();
    const stageSizeMode = state.scratchGui.stageSize.stageSize;
    const theme = state.scratchGui.theme.theme;

    // console.log("theme:", theme);

    return {
        blocksId,
        stageSizeMode,
        theme,
    };
};

export default injectIntl(connect(mapStateToProps)(GUIComponent));
