import bindAll from "lodash.bindall";
import debounce from "lodash.debounce";
import isEqual from "lodash/isEqual";
import defaultsDeep from "lodash.defaultsdeep";
import PropTypes from "prop-types";
import React from "react";
import VM from "scratch-vm";
import VMScratchBlocks from "../lib/blocks";
import makeToolboxXML from "../lib/make-toolbox-xml";

import BlocksComponent from "../components/blocks/blocks.jsx";
import defineDynamicBlock from "../lib/define-dynamic-block";
import DragConstants from "../lib/drag-constants";
import DropAreaHOC from "../lib/drop-area-hoc.jsx";
import errorBoundaryHOC from "../lib/error-boundary-hoc.jsx";
import {
    BLOCKS_DEFAULT_SCALE,
    STAGE_DISPLAY_SIZES,
} from "../lib/layout-constants";
import extensionData from "../lib/libraries/extensions/index.jsx";
import log from "../lib/log.js";
import { DEFAULT_THEME, getColorsForTheme, themeMap } from "../lib/themes";
import {
    injectExtensionBlockTheme,
    injectExtensionCategoryTheme,
} from "../lib/themes/blockHelpers";
import CustomProcedures from "./custom-procedures.jsx";
import ExtensionLibrary from "./extension-library.jsx";
import Prompt from "./prompt.jsx";

import { connect } from "react-redux";
import { activateColorPicker } from "../reducers/color-picker";
import { setConnectionModalExtensionId } from "../reducers/connection-modal";
import {
    activateCustomProcedures,
    deactivateCustomProcedures,
} from "../reducers/custom-procedures";
import {
    closeExtensionLibrary,
    openConnectionModal,
    openSoundRecorder,
} from "../reducers/modals";
import { isTimeTravel2020 } from "../reducers/time-travel";
import { updateToolbox } from "../reducers/toolbox";
import { updateMetrics } from "../reducers/workspace-metrics";

import { activateTab, SOUNDS_TAB_INDEX } from "../reducers/editor-tab";

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([DragConstants.BACKPACK_CODE])(
    BlocksComponent
);

class Blocks extends React.Component {
    constructor(props) {
        super(props);
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);
        this.blockTypes = []; // Array to store block types
        bindAll(this, [
            "attachVM",
            "detachVM",
            "getToolboxXML",
            "handleCategorySelected",
            "handleConnectionModalStart",
            "handleDrop",
            "handleStatusButtonUpdate",
            "handleOpenSoundRecorder",
            "handlePromptStart",
            "handlePromptCallback",
            "handlePromptClose",
            "handleCustomProceduresClose",
            "onScriptGlowOn",
            "onScriptGlowOff",
            "onBlockGlowOn",
            "onBlockGlowOff",
            "handleMonitorsUpdate",
            "handleExtensionAdded",
            "handleBlocksInfoUpdate",
            "onTargetsUpdate",
            "onVisualReport",
            "onWorkspaceUpdate",
            "onWorkspaceMetricsChange",
            "setBlocks",
            "setLocale",
        ]);
        this.handleBlockChange = this.handleBlockChange.bind(this);

        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback =
            this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.state = {
            prompt: null,
        };
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.toolboxUpdateQueue = [];
    }
    componentDidMount() {
        console.log("Component Did Mount - LMS Preferences:", this.props.currentLMSPreferences);

        this.ScratchBlocks = VMScratchBlocks(
            this.props.vm,
            this.props.useCatBlocks
        );
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback =
            this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ =
            this.props.onActivateColorPicker;
        this.ScratchBlocks.Procedures.externalProcedureDefCallback =
            this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const workspaceConfig = defaultsDeep(
            {},
            Blocks.defaultOptions,
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolboxXML,
                colours: getColorsForTheme(this.props.theme),
            }
        );
        this.workspace = this.ScratchBlocks.inject(
            this.blocks,
            workspaceConfig
        );

        console.log("this is workspace", this.workspace)

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();
        console.log("toolboxworkspace", toolboxWorkspace)

        const varListButtonCallback = (type) => () =>
            this.ScratchBlocks.Variables.createVariable(
                this.workspace,
                null,
                type
            );
        const procButtonCallback = () => {
            this.ScratchBlocks.Procedures.createProcedureDefCallback_(
                this.workspace
            );
        };

        toolboxWorkspace.registerButtonCallback(
            "MAKE_A_VARIABLE",
            varListButtonCallback("")
        );
        toolboxWorkspace.registerButtonCallback(
            "MAKE_A_LIST",
            varListButtonCallback("list")
        );
        toolboxWorkspace.registerButtonCallback(
            "MAKE_A_PROCEDURE",
            procButtonCallback
        );

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // we actually never want the workspace to enable "refresh toolbox" - this basically re-renders the
        // entire toolbox every time we reset the workspace.  We call updateToolbox as a part of
        // componentDidUpdate so the toolbox will still correctly be updated
        this.setToolboxRefreshEnabled =
            this.workspace.setToolboxRefreshEnabled.bind(this.workspace);
        this.workspace.setToolboxRefreshEnabled = () => {
            this.setToolboxRefreshEnabled(false);
        };

        // @todo change this when blockly supports UI events
        addFunctionListener(
            this.workspace,
            "translate",
            this.onWorkspaceMetricsChange
        );
        addFunctionListener(
            this.workspace,
            "zoom",
            this.onWorkspaceMetricsChange
        );

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }
        this.workspace.addChangeListener(this.handleBlockChange);
    }

    // Function to extract block values
    extractBlockValues(block) {
        const values = {};
        console.log("Extract", block.type);
        block.inputList.forEach((input) => {
            if (input.connection && input.connection.targetBlock()) {
                const targetBlock = input.connection.targetBlock();
                const fieldName = targetBlock.inputList[0]?.fieldRow[0]?.name;
                if (fieldName) {
                    values[input.name] = targetBlock.getFieldValue(fieldName);
                }
            } else if (input.fieldRow && input.fieldRow[0]) {
                const fieldName = input.fieldRow[0]?.name;
                if (fieldName) {
                    values[input.name] = input.fieldRow[0].getValue();
                }
            }
        });
        console.log("Values", values);
        return values;
    }

    updateBlockInfo(blockId) {
        const block = this.workspace.getBlockById(blockId);
        if (block) {
            const blockType = block.type;
            const blockValues = this.extractBlockValues(block);
            const blockInfo = {
                id: blockId,
                type: blockType,
                values: blockValues,
            };

            const index = this.blockTypes.findIndex((b) => b.id === blockId);
            if (index > -1) {
                this.blockTypes[index] = blockInfo;
            } else {
                this.blockTypes.push(blockInfo);
            }
        }

    }

    handleBlockChange = (event) => {
        if (event.type === "create") {
            const block = this.workspace.getBlockById(event.blockId);
            if (block) {
                const blockType = block.type;
                const blockValues = this.extractBlockValues(block);
                const blockInfo = {
                    id: event.blockId,
                    type: blockType,
                    values: blockValues,
                };
                this.blockTypes.push(blockInfo);
            }
        } else if (event.type === "move") {
            console.log("move called");
            this.updateBlockInfo(event.blockId);
        } else if (event.type === "change") {
            console.log("change called");
            const block = this.workspace.getBlockById(event.blockId);
            if (block) {
                if (block.parentBlock_) {
                    console.log(
                        "Updating parent block:",
                        block.parentBlock_.type
                    );
                    this.updateBlockInfo(block.parentBlock_.id);
                } else {
                    this.updateBlockInfo(event.blockId);
                }
            }
        } else if (event.type === "delete") {
            const deletedBlockXML = event.oldXml;

            const deleteBlocksRecursively = (blockXML) => {
                const blockType = blockXML.getAttribute("type");

                this.blockTypes = this.blockTypes.filter(
                    (block) => block.type !== blockType
                );

                const nextBlockXML = blockXML.querySelector("next > block");
                if (nextBlockXML) {
                    deleteBlocksRecursively(nextBlockXML);
                }
            };

            // Start the deletion process with the top-level block
            deleteBlocksRecursively(deletedBlockXML);
        }

        console.log("Current block types:", this.blockTypes);
    };

    // shouldComponentUpdate(nextProps, nextState) {
    //     // console.log("Current LMS Preferences:", this.props.currentLMSPreferences);
    //     // console.log("Next LMS Preferences:", nextProps.currentLMSPreferences);
    // const currentLMSPrefs = this.props.currentLMSPreferences || [];
    // const nextLMSPrefs = nextProps.currentLMSPreferences || [];

    // console.log("Current LMS Prefs in shouldUpdate:", currentLMSPrefs);
    // console.log("Next LMS Prefs in shouldUpdate:", nextLMSPrefs);

    // // Check for deep equality between current and next LMS preferences
    // const lmsPrefsChanged = !isEqual(currentLMSPrefs, nextLMSPrefs);

    // console.log("LMS Preferences changed:", lmsPrefsChanged);

    //     const shouldUpdate =
    //         this.state.prompt !== nextState.prompt ||
    //         this.props.isVisible !== nextProps.isVisible ||
    //         this._renderedToolboxXML !== nextProps.toolboxXML ||
    //         this.props.extensionLibraryVisible !==
    //             nextProps.extensionLibraryVisible ||
    //         this.props.customProceduresVisible !==
    //             nextProps.customProceduresVisible ||
    //         this.props.locale !== nextProps.locale ||
    //         this.props.anyModalVisible !== nextProps.anyModalVisible ||
    //         this.props.stageSize !== nextProps.stageSize ||
    //         this.props.currentPreferences !== nextProps.currentPreferences;
    //         // !isEqual(this.props.currentLMSPreferences?.[2].subSelectedBlock , prevProps.currentLMSPreferences?.[2].subSelectedBlock);
    //         // !isEqual(this.props.currentLMSPreferences, nextProps.currentLMSPreferences);    
    //         lmsPrefsChanged,  
    //         console.log("shouldComponentUpdate:", shouldUpdate);
    //     return shouldUpdate;
    // }
    shouldComponentUpdate(nextProps, nextState) {
        // Get current and next LMS preferences with default empty arrays
        const currentLMSPrefs = this.props.currentLMSPreferences || [];
        const nextLMSPrefs = nextProps.currentLMSPreferences || [];

        // Check each category of blocks for changes
        const categoryChanges = currentLMSPrefs.map((category, index) => {
            const nextCategory = nextLMSPrefs[index];
            return !isEqual(category?.subSelectedBlock, nextCategory?.subSelectedBlock);
        });

        const lmsPrefsChanged = categoryChanges.some(changed => changed);

        console.log("Category changes:", categoryChanges);
        console.log("LMS Preferences changed:", lmsPrefsChanged);

        // Log specific changes for debugging
        if (lmsPrefsChanged) {
            currentLMSPrefs.forEach((category, index) => {
                if (categoryChanges[index]) {
                    console.log(`Changes detected in ${category.blockCategory} category:`, {
                        current: category.subSelectedBlock,
                        next: nextLMSPrefs[index]?.subSelectedBlock
                    });
                }
            });
        }

        const shouldUpdate = (
            this.state.prompt !== nextState.prompt ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize ||
            this.props.currentPreferences !== nextProps.currentPreferences ||
            lmsPrefsChanged
        );
        return shouldUpdate;
    }

    componentDidUpdate(prevProps) {
        console.log("Component Did Update");

        // Safely access LMS preferences with specific category checks
        console.log("Previous LMS preferences:", prevProps.currentLMSPreferences);
        console.log("Current LMS preferences:", this.props.currentLMSPreferences);

        const hasLMSPreferencesChanged = !isEqual(
            this.props.currentLMSPreferences,
            prevProps.currentLMSPreferences
        );

        const hasPreferencesChanged = !isEqual(
            this.props.currentPreferences,
            prevProps.currentPreferences
        );

        // Store the current XML before updates
        const previousToolboxXML = this._renderedToolboxXML;

        if (hasLMSPreferencesChanged) {
            console.log("Preferences or LMS Preferences have changed");
            // Update toolbox first
            this.requestToolboxUpdate();
            // Then refresh workspace
            this.props.vm.refreshWorkspace();
        }

        // Handle modal visibility
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        // Check for toolbox XML changes
        if (
            this.props.isVisible &&
            this.props.toolboxXML !== previousToolboxXML
        ) {
            this.requestToolboxUpdate();
        }

        // Handle visibility changes
        if (this.props.isVisible === prevProps.isVisible) {
            if (this.props.stageSize !== prevProps.stageSize) {
                window.dispatchEvent(new Event("resize"));
            }
        } else if (this.props.isVisible) {
            this.workspace.setVisible(true);
            if (
                prevProps.locale !== this.props.locale ||
                this.props.locale !== this.props.vm.getLocale()
            ) {
                this.setLocale();
            } else {
                // Preserve LMS preferences when refreshing
                const currentLMSPrefs = this.props.currentLMSPreferences;
                this.props.vm.refreshWorkspace();
                // Ensure toolbox update uses the current LMS preferences
                setTimeout(() => {
                    if (!isEqual(this.props.currentLMSPreferences, currentLMSPrefs)) {
                        this.requestToolboxUpdate();
                    }
                }, 0);
            }
            window.dispatchEvent(new Event("resize"));
        } else {
            this.workspace.setVisible(false);
        }
    }

    componentWillUnmount() {
        this.detachVM();
        if (this.workspace) {
            this.workspace.removeChangeListener(this.handleBlockChange);
        }
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);

        // Clear the flyout blocks so that they can be recreated on mount.
        this.props.vm.clearFlyoutBlocks();
    }
    requestToolboxUpdate() {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale() {
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm
            .setLocale(this.props.locale, this.props.messages)
            .then(() => {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox() {
        this.toolboxUpdateTimeout = false;

        const categoryId = this.workspace.toolbox_.getSelectedCategoryId();
        const offset = this.workspace.toolbox_.getCategoryScrollOffset();
        this.workspace.updateToolbox(this.props.toolboxXML);
        this._renderedToolboxXML = this.props.toolboxXML;

        // In order to catch any changes that mutate the toolbox during "normal runtime"
        // (variable changes/etc), re-enable toolbox refresh.
        // Using the setter function will rerender the entire toolbox which we just rendered.
        this.workspace.toolboxRefreshEnabled_ = true;

        const currentCategoryPos =
            this.workspace.toolbox_.getCategoryPositionById(categoryId);
        const currentCategoryLen =
            this.workspace.toolbox_.getCategoryLengthById(categoryId);
        if (offset < currentCategoryLen) {
            this.workspace.toolbox_.setFlyoutScrollPos(
                currentCategoryPos + offset
            );
        } else {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos);
        }

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach((fn) => fn());

    }

    withToolboxUpdates(fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM() {
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace.getFlyout().getWorkspace();
        this.flyoutWorkspace.addChangeListener(
            this.props.vm.flyoutBlockListener
        );
        this.flyoutWorkspace.addChangeListener(
            this.props.vm.monitorBlockListener
        );
        this.props.vm.addListener("SCRIPT_GLOW_ON", this.onScriptGlowOn);
        this.props.vm.addListener("SCRIPT_GLOW_OFF", this.onScriptGlowOff);
        this.props.vm.addListener("BLOCK_GLOW_ON", this.onBlockGlowOn);
        this.props.vm.addListener("BLOCK_GLOW_OFF", this.onBlockGlowOff);
        this.props.vm.addListener("VISUAL_REPORT", this.onVisualReport);
        this.props.vm.addListener("workspaceUpdate", this.onWorkspaceUpdate);
        this.props.vm.addListener("targetsUpdate", this.onTargetsUpdate);
        this.props.vm.addListener("MONITORS_UPDATE", this.handleMonitorsUpdate);
        this.props.vm.addListener("EXTENSION_ADDED", this.handleExtensionAdded);
        this.props.vm.addListener(
            "BLOCKSINFO_UPDATE",
            this.handleBlocksInfoUpdate
        );
        this.props.vm.addListener(
            "PERIPHERAL_CONNECTED",
            this.handleStatusButtonUpdate
        );
        this.props.vm.addListener(
            "PERIPHERAL_DISCONNECTED",
            this.handleStatusButtonUpdate
        );
    }
    detachVM() {
        this.props.vm.removeListener("SCRIPT_GLOW_ON", this.onScriptGlowOn);
        this.props.vm.removeListener("SCRIPT_GLOW_OFF", this.onScriptGlowOff);
        this.props.vm.removeListener("BLOCK_GLOW_ON", this.onBlockGlowOn);
        this.props.vm.removeListener("BLOCK_GLOW_OFF", this.onBlockGlowOff);
        this.props.vm.removeListener("VISUAL_REPORT", this.onVisualReport);
        this.props.vm.removeListener("workspaceUpdate", this.onWorkspaceUpdate);
        this.props.vm.removeListener("targetsUpdate", this.onTargetsUpdate);
        this.props.vm.removeListener(
            "MONITORS_UPDATE",
            this.handleMonitorsUpdate
        );
        this.props.vm.removeListener(
            "EXTENSION_ADDED",
            this.handleExtensionAdded
        );
        this.props.vm.removeListener(
            "BLOCKSINFO_UPDATE",
            this.handleBlocksInfoUpdate
        );
        this.props.vm.removeListener(
            "PERIPHERAL_CONNECTED",
            this.handleStatusButtonUpdate
        );
        this.props.vm.removeListener(
            "PERIPHERAL_DISCONNECTED",
            this.handleStatusButtonUpdate
        );
    }

    updateToolboxBlockValue(id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate() {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ["glide", "move", "set"].forEach((prefix) => {
                this.updateToolboxBlockValue(
                    `${prefix}x`,
                    Math.round(this.props.vm.editingTarget.x).toString()
                );
                this.updateToolboxBlockValue(
                    `${prefix}y`,
                    Math.round(this.props.vm.editingTarget.y).toString()
                );
            });
        }
    }
    onWorkspaceMetricsChange() {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            // Dispatch updateMetrics later, since onWorkspaceMetricsChange may be (very indirectly)
            // called from a reducer, i.e. when you create a custom procedure.
            // TODO: Is this a vehement hack?
            setTimeout(() => {
                this.props.updateMetrics({
                    targetID: target.id,
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale,
                });
            }, 0);
        }
    }
    onScriptGlowOn(data) {
        const ws = this.workspace;
        if (!ws) return;
        const id = data && (data.id || data);
        if (!id || !ws.getBlockById(id)) return; // block not in this workspace
        ws.glowStack(id, true);
    }

    onScriptGlowOff(data) {
        const ws = this.workspace;
        if (!ws) return;
        const id = data && (data.id || data);
        if (!id || !ws.getBlockById(id)) return;
        ws.glowStack(id, false);
    }

    onBlockGlowOn(data) {
        const ws = this.workspace;
        if (!ws) return;
        const id = data && (data.id || data);
        if (!id || !ws.getBlockById(id)) return;
        ws.glowBlock(id, true); // or block.setGlow(true) if your blocks build uses that API
    }

    onBlockGlowOff(data) {
        const ws = this.workspace;
        if (!ws) return;
        const id = data && (data.id || data);
        if (!id || !ws.getBlockById(id)) return;
        ws.glowBlock(id, false); // or block.setGlow(false)
    }

    onVisualReport(data) {
        const ws = this.workspace;
        if (!ws) return;
        const id = data && (data.id || data);
        if (!id || !ws.getBlockById(id)) return;
        ws.reportValue(id, data.value);
    }

    getToolboxXML() {
        console.log("getToolboxXML called");
        console.log("LMS Preferences:", this.props.currentLMSPreferences);
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let { editingTarget: target, runtime } = this.props.vm;
            const stage = runtime.getTargetForStage();

            if (!target) {
                target = stage;
            }

            console.log('🔥 TOOLBOX TARGET:', target);
            console.log('🔥 TOOLBOX TARGET ID:', target && target.id);
            console.log('🔥 EDITING TARGET:', this.props.vm.editingTarget);

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();

            const rawDynamicBlocksXML =
                this.props.vm.runtime.getBlocksXML(target);

            console.log("🔥🔥🔥 RAW DYNAMIC BLOCKS 🔥🔥🔥");
            console.log(
                JSON.stringify(rawDynamicBlocksXML, null, 2)
            );

            const dynamicBlocksXML = injectExtensionCategoryTheme(
                rawDynamicBlocksXML,
                this.props.theme
            );

            console.log("🔥🔥🔥 THEMED DYNAMIC BLOCKS 🔥🔥🔥");
            console.log(
                JSON.stringify(dynamicBlocksXML, null, 2)
            );

            console.log(
                "🔥🔥🔥 EXTENSION CATEGORY SUMMARY 🔥🔥🔥",
                dynamicBlocksXML?.map(category => ({
                    id: category?.id,
                    name: category?.name,
                    hasXml: Boolean(category?.xml),
                    xmlPreview: category?.xml?.substring?.(0, 300)
                }))
            );

            const penLoaded = dynamicBlocksXML?.some(
                extension => extension?.id === "pen"
            );

            console.log("🔥 PEN CATEGORY PRESENT:", penLoaded);

            if (
                this.props.vm.extensionManager &&
                this.props.vm.extensionManager.isExtensionLoaded("pen") &&
                !penLoaded
            ) {
                console.log("🔥 PEN IS LOADED BUT MISSING FROM DYNAMIC BLOCKS");

                const penExtension =
                    this.props.vm.extensionManager._loadedExtensions?.pen;

                console.log("🔥 LOADED PEN EXTENSION:", penExtension);
            }

            console.log(
                "🔥🔥🔥 DYNAMIC BLOCKS BEFORE TOOLBOX 🔥🔥🔥",
                dynamicBlocksXML
            );

            console.log(
                "🔥 DYNAMIC BLOCK COUNT:",
                dynamicBlocksXML?.length
            );
            const getLMSBlockValue = (categoryIndex, blockIndex) =>
                this.props.currentLMSPreferences?.[categoryIndex]
                    ?.subSelectedBlock?.[blockIndex]?.value ?? false;
            return makeToolboxXML(
                false,
                target.isStage,
                target.id,
                dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0
                    ? targetSounds[targetSounds.length - 1].name
                    : "",
                getColorsForTheme(this.props.theme),

                // 1. MOTION BLOCKS
                getLMSBlockValue(0, 0),
                getLMSBlockValue(0, 1),
                getLMSBlockValue(0, 2),
                getLMSBlockValue(0, 3),
                getLMSBlockValue(0, 4),
                getLMSBlockValue(0, 5),
                getLMSBlockValue(0, 6),
                getLMSBlockValue(0, 7),
                getLMSBlockValue(0, 8),
                getLMSBlockValue(0, 9),
                getLMSBlockValue(0, 10),
                getLMSBlockValue(0, 11),
                getLMSBlockValue(0, 12),
                getLMSBlockValue(0, 13),
                getLMSBlockValue(0, 14),
                getLMSBlockValue(0, 15),
                getLMSBlockValue(0, 16),

                // 2. LOOKS BLOCKS
                getLMSBlockValue(1, 0),
                getLMSBlockValue(1, 1),
                getLMSBlockValue(1, 2),
                getLMSBlockValue(1, 3),
                getLMSBlockValue(1, 4),
                getLMSBlockValue(1, 5),
                getLMSBlockValue(1, 6),
                getLMSBlockValue(1, 7),
                getLMSBlockValue(1, 8),
                getLMSBlockValue(1, 9),
                getLMSBlockValue(1, 10),
                getLMSBlockValue(1, 11),
                getLMSBlockValue(1, 12),
                getLMSBlockValue(1, 13),
                getLMSBlockValue(1, 14),
                getLMSBlockValue(1, 15),
                getLMSBlockValue(1, 16),
                getLMSBlockValue(1, 17),
                getLMSBlockValue(1, 18),
                getLMSBlockValue(1, 19),


                // 3. SOUND BLOCKS
                getLMSBlockValue(2, 0),
                getLMSBlockValue(2, 1),
                getLMSBlockValue(2, 2),
                getLMSBlockValue(2, 3),
                getLMSBlockValue(2, 4),
                getLMSBlockValue(2, 5),
                getLMSBlockValue(2, 6),
                getLMSBlockValue(2, 7),
                getLMSBlockValue(2, 8),
                getLMSBlockValue(2, 9),

                // 4. EVENT BLOCKS
                getLMSBlockValue(3, 0),
                getLMSBlockValue(3, 1),
                getLMSBlockValue(3, 2),
                getLMSBlockValue(3, 3),
                getLMSBlockValue(3, 4),
                getLMSBlockValue(3, 5),
                getLMSBlockValue(3, 6),
                getLMSBlockValue(3, 7),
                getLMSBlockValue(3, 8),
                getLMSBlockValue(3, 9),

                // 5. CONTROL BLOCKS
                getLMSBlockValue(4, 0),
                getLMSBlockValue(4, 1),
                getLMSBlockValue(4, 2),
                getLMSBlockValue(4, 3),
                getLMSBlockValue(4, 4),
                getLMSBlockValue(4, 5),
                getLMSBlockValue(4, 6),
                getLMSBlockValue(4, 7),
                getLMSBlockValue(4, 8),
                getLMSBlockValue(4, 9),
                getLMSBlockValue(4, 10),
                getLMSBlockValue(4, 11),


                // 6. SENSING BLOCKS
                getLMSBlockValue(5, 0),
                getLMSBlockValue(5, 1),
                getLMSBlockValue(5, 2),
                getLMSBlockValue(5, 3),
                getLMSBlockValue(5, 4),
                getLMSBlockValue(5, 5),
                getLMSBlockValue(5, 6),
                getLMSBlockValue(5, 7),
                getLMSBlockValue(5, 8),
                getLMSBlockValue(5, 9),
                getLMSBlockValue(5, 10),
                getLMSBlockValue(5, 11),
                getLMSBlockValue(5, 12),
                getLMSBlockValue(5, 13),
                getLMSBlockValue(5, 14),
                getLMSBlockValue(5, 15),
                getLMSBlockValue(5, 16),
                getLMSBlockValue(5, 17),
                getLMSBlockValue(5, 18),

                // 7. OPERATORS BLOCKS
                getLMSBlockValue(6, 0),
                getLMSBlockValue(6, 1),
                getLMSBlockValue(6, 2),
                getLMSBlockValue(6, 3),
                getLMSBlockValue(6, 4),
                getLMSBlockValue(6, 5),
                getLMSBlockValue(6, 6),
                getLMSBlockValue(6, 7),
                getLMSBlockValue(6, 8),
                getLMSBlockValue(6, 9),
                getLMSBlockValue(6, 10),
                getLMSBlockValue(6, 11),
                getLMSBlockValue(6, 12),
                getLMSBlockValue(6, 13),
                getLMSBlockValue(6, 14),
                getLMSBlockValue(6, 15),
                getLMSBlockValue(6, 16),
                getLMSBlockValue(6, 17),
                getLMSBlockValue(6, 18),

                // 8. VARIABLE BLOCKS
                getLMSBlockValue(7, 0),
                getLMSBlockValue(7, 1),
                getLMSBlockValue(7, 2),
                getLMSBlockValue(7, 3),
                getLMSBlockValue(7, 4),
                getLMSBlockValue(7, 5),

                // 9. MYBLOCKS BLOCKS
                getLMSBlockValue(8, 0),
                getLMSBlockValue(8, 1),

            );
        } catch (error) {
            console.error(error);
            console.error("MESSAGE:", error?.message);
            console.error("STACK:", error?.stack);

            return null;
        }
    }
    onWorkspaceUpdate(data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        if (
            this.props.vm.editingTarget &&
            !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]
        ) {
            this.onWorkspaceMetricsChange();
        }

        // Remove and reattach the workspace listener (but allow flyout events)
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        const dom = this.ScratchBlocks.Xml.textToDom(data.xml);
        try {
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(
                dom,
                this.workspace
            );
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }
        this.workspace.addChangeListener(this.props.vm.blockListener);

        if (
            this.props.vm.editingTarget &&
            this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]
        ) {
            const { scrollX, scrollY, scale } =
                this.props.workspaceMetrics.targets[
                this.props.vm.editingTarget.id
                ];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
    }
    handleMonitorsUpdate(monitors) {
        // Update the checkboxes of the relevant monitors.
        // TODO: What about monitors that have fields? See todo in scratch-vm blocks.js changeBlock:
        // https://github.com/LLK/scratch-vm/blob/2373f9483edaf705f11d62662f7bb2a57fbb5e28/src/engine/blocks.js#L569-L576
        // const flyout = this.workspace.getFlyout();
        for (const monitor of monitors.values()) {
            const blockId = monitor.get("id");
            const isVisible = monitor.get("visible");
            // flyout.setCheckboxState(blockId, isVisible);
            // We also need to update the isMonitored flag for this block on the VM, since it's used to determine
            // whether the checkbox is activated or not when the checkbox is re-displayed (e.g. local variables/blocks
            // when switching between sprites).
            const block = this.props.vm.runtime.monitorBlocks.getBlock(blockId);
            if (block) {
                block.isMonitored = isVisible;
            }
        }
    }
    handleExtensionAdded(categoryInfo) {
        console.log(
            "🔥🔥🔥🔥🔥 EXTENSION_ADDED EVENT RECEIVED 🔥🔥🔥🔥🔥",
            categoryInfo
        );
        console.log(
            "🔥🔥🔥 BLOCKS HANDLE EXTENSION ADDED:",
            categoryInfo
        );

        console.log(
            "🔥 EXTENSION ID:",
            categoryInfo?.id
        );

        const defineBlocks = (blockInfoArray) => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach((blockInfo) => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(
                            injectExtensionBlockTheme(
                                blockInfo.json,
                                this.props.theme
                            )
                        );
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach((blockInfo) => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition = defineDynamicBlock(
                        this.ScratchBlocks,
                        categoryInfo,
                        blockInfo,
                        extendedOpcode
                    );
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes).map(
                (fieldTypeName) =>
                    categoryInfo.customFieldTypes[fieldTypeName]
                        .scratchBlocksDefinition
            )
        );
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);

        // Update the toolbox with new blocks if possible
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleBlocksInfoUpdate(categoryInfo) {
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(categoryInfo);
    }
    handleCategorySelected(categoryId) {
        const extension = extensionData.find(
            ext => ext.extensionId === categoryId
        );

        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        console.log(
            "🔥🔥🔥 CATEGORY SELECTED:",
            categoryId
        );

        // Rebuild the toolbox because the extension may have
        // been loaded immediately before the category was selected.
        const toolboxXML = this.getToolboxXML();

        console.log(
            "🔥🔥🔥 TOOLBOX XML AFTER EXTENSION LOAD 🔥🔥🔥"
        );

        console.log(
            "HAS PEN:",
            toolboxXML?.includes('id="pen"')
        );

        console.log(
            "TOOLBOX XML:",
            toolboxXML
        );

        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        // Wait until the toolbox update has been processed
        // before selecting the extension category.
        this.withToolboxUpdates(() => {
            console.log(
                "🔥🔥🔥 SELECTING CATEGORY:",
                categoryId
            );

            this.workspace.toolbox_.setSelectedCategoryById(
                categoryId
            );
        });
    }
    setBlocks(blocks) {
        this.blocks = blocks;
    }
    handlePromptStart(message, defaultValue, callback, optTitle, optVarType) {
        const p = { prompt: { callback, message, defaultValue } };
        p.prompt.title = optTitle
            ? optTitle
            : this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType =
            typeof optVarType === "string"
                ? optVarType
                : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !==
            this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption =
            optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE &&
            this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart(extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate() {
        this.ScratchBlocks.refreshStatusButtons(this.workspace);
    }
    handleOpenSoundRecorder() {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback(input, variableOptions) {
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(
                this.state.prompt.varType
            ),
            variableOptions
        );
        this.handlePromptClose();
    }
    handlePromptClose() {
        this.setState({ prompt: null });
    }
    handleCustomProceduresClose(data) {
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        ws.refreshToolboxSelection_();
        ws.toolbox_.scrollToCategoryById("myBlocks");
    }
    handleDrop(dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then((response) => response.json())
            .then((blocks) =>
                this.props.vm.shareBlocksToTarget(
                    blocks,
                    this.props.vm.editingTarget.id
                )
            )
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    render() {
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            canUseCloud,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            updateMetrics: updateMetricsProp,
            useCatBlocks,
            workspaceMetrics,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        // console.log("props from blocks.jsx", this.props);
        return (
            <React.Fragment>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        showListMessage={
                            this.state.prompt.varType ===
                            this.ScratchBlocks.LIST_VARIABLE_TYPE
                        }
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={
                            this.state.prompt.showVariableOptions
                        }
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media,
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

const MOTION_BLOCKS = [
    'motion_move_block',
    'motion_turn_right_block',
    'motion_turn_left_block',
    'motion_goto',
    'motion_gotoxy',
    'motion_glideto',
    'motion_glidesecstoxy',
    'motion_pointindirection',
    'motion_pointtowards',
    'motion_changexby',
    'motion_setx',
    'motion_changeyby',
    'motion_sety',
    'motion_ifonedgebounce',
    'motion_setrotationstyle',
    'motion_xyposition_direction'
];

const LOOKS_BLOCKS = [
    'looks_sayforsecs',
    'looks_say',
    'looks_thinkforsecs',
    'looks_think',
    'looks_switchbackdropto',
    'looks_switchbackdroptoandwait',
    'looks_nextbackdrop',
    'looks_switchcostumeto',
    'looks_nextcostume',
    'looks_changesizeby',
    'looks_setsizeto',
    'looks_changeeffectby',
    'looks_seteffectto',
    'looks_cleargraphiceffects',
    'looks_show_hide',
    'looks_gotofrontback',
    'looks_goforwardbackwardlayers',
    'looks_backdropnumbername',
    'looks_numbername_size'
];

const SOUND_BLOCKS = [
    'sound_playuntildone',
    'sound_play',
    'sound_stopallsounds',
    'sound_changeeffectby',
    'sound_seteffectto',
    'sound_cleareffects',
    'sound_changevolumeby',
    'sound_setvolumeto',
    'sound_volume'
];

const EVENTS_BLOCKS = [
    'event_whenflagclicked',
    'event_whenkeypressed',
    'event_whenstageclicked',
    'event_whenthisspriteclicked',
    'event_whenbackdropswitchesto',
    'event_whengreaterthan',
    'event_whenbroadcastreceived',
    'event_broadcast',
    'event_broadcastandwait'
];

const CONTROL_BLOCKS = [
    'control_wait',
    'control_repeat',
    'control_forever',
    'control_if',
    'control_if_else',
    'control_wait_until',
    'control_repeat_until',
    'control_stop',
    'control_create_clone_of',
    'control_start_as_clone',
    'control_delete_this_clone'
];

const SENSING_BLOCKS = [
    'sensing_touchingobject',
    'sensing_touchingcolor',
    'sensing_coloristouchingcolor',
    'sensing_distanceto',
    'sensing_askandwait',
    'sensing_answer',
    'sensing_keypressed',
    'sensing_mousedown',
    'sensing_mousex',
    'sensing_mousey',
    'sensing_setdragmode',
    'sensing_loudness',
    'sensing_timer',
    'sensing_resettimer',
    'sensing_of',
    'sensing_current',
    'sensing_dayssince2000',
    'sensing_username'
];

const OPERATORS_BLOCKS = [
    'operator_add',
    'operator_subtract',
    'operator_multiply',
    'operator_divide',
    'operator_random',
    'operator_gt',
    'operator_lt',
    'operator_equals',
    'operator_and',
    'operator_or',
    'operator_not',
    'operator_join',
    'operator_letter_of',
    'operator_length',
    'operator_contains',
    'operator_mod',
    'operator_round',
    'operator_mathop'
];

const VARIABLES_BLOCKS = [
    'variables_myvariable',
    'variables_setto',
    'variables_changeby',
    'variables_showvariable',
    'variables_hidevariable'
];

const MYBLOCKS_BLOCKS = [
    'myblocks_makeablock'
];

const createBlockValidator = (category, allowedBlocks) => {
    return PropTypes.shape({
        blockCategory: PropTypes.oneOf([category]).isRequired,
        subSelectedBlock: PropTypes.arrayOf(
            PropTypes.shape({
                subBlockName: PropTypes.oneOf(allowedBlocks).isRequired,
                value: PropTypes.bool.isRequired
            })
        ).isRequired
    });
};

Blocks.propTypes = {

    currentLMSPreferences: PropTypes.arrayOf(
        PropTypes.oneOfType([
            createBlockValidator('motion', MOTION_BLOCKS),
            createBlockValidator('looks', LOOKS_BLOCKS),
            createBlockValidator('sound', SOUND_BLOCKS),
            createBlockValidator('events', EVENTS_BLOCKS),
            createBlockValidator('control', CONTROL_BLOCKS),
            createBlockValidator('sensing', SENSING_BLOCKS),
            createBlockValidator('operators', OPERATORS_BLOCKS),
            createBlockValidator('variables', VARIABLES_BLOCKS),
            createBlockValidator('myblocks', MYBLOCKS_BLOCKS)
        ])
    ).isRequired,
    // currentLMSPreferences: PropTypes.array,
    currentPreferences: PropTypes.shape({
        motion: PropTypes.shape({
            showMotionCategory: PropTypes.bool,
            motion_move_block: PropTypes.bool,
            motion_turn_right_block: PropTypes.bool,
            motion_turn_left_block: PropTypes.bool,
            motion_goto: PropTypes.bool,
            motion_gotoxy: PropTypes.bool,
            motion_glideto: PropTypes.bool,
            motion_glidesecstoxy: PropTypes.bool,
            motion_pointindirection: PropTypes.bool,
            motion_pointtowards: PropTypes.bool,
            motion_changexby: PropTypes.bool,
            motion_setx: PropTypes.bool,
            motion_changeyby: PropTypes.bool,
            motion_sety: PropTypes.bool,
            motion_ifonedgebounce: PropTypes.bool,
            motion_setrotationstyle: PropTypes.bool,
            motion_xyposition_direction: PropTypes.bool,
            isMotionDisabled: PropTypes.bool,
        }),
        looks: PropTypes.shape({
            showlooksCategory: PropTypes.bool,
            looks_sayforsecs: PropTypes.bool,
            looks_say: PropTypes.bool,
            looks_thinkforsecs: PropTypes.bool,
            looks_think: PropTypes.bool,
            looks_switchbackdropto: PropTypes.bool,
            looks_switchbackdroptoandwait: PropTypes.bool,
            looks_nextbackdrop: PropTypes.bool,
            looks_switchcostumeto: PropTypes.bool,
            looks_nextcostume: PropTypes.bool,
            looks_changesizeby: PropTypes.bool,
            looks_setsizeto: PropTypes.bool,
            looks_changeeffectby: PropTypes.bool,
            looks_seteffectto: PropTypes.bool,
            looks_cleargraphiceffects: PropTypes.bool,
            looks_show_hide: PropTypes.bool,
            looks_gotofrontback: PropTypes.bool,
            looks_goforwardbackwardlayers: PropTypes.bool,
            looks_backdropnumbername: PropTypes.bool,
            looks_numbername_size: PropTypes.bool,
        }),
        sound: PropTypes.shape({
            showsoundCategory: PropTypes.bool,
            sound_playuntildone: PropTypes.bool,
            sound_play: PropTypes.bool,
            sound_stopallsounds: PropTypes.bool,
            sound_changeeffectby: PropTypes.bool,
            sound_seteffectto: PropTypes.bool,
            sound_cleareffects: PropTypes.bool,
            sound_changevolumeby: PropTypes.bool,
            sound_setvolumeto: PropTypes.bool,
            sound_volume: PropTypes.bool,
        }),
        event: PropTypes.shape({
            showeventCategory: PropTypes.bool,
            event_whenflagclicked: PropTypes.bool,
            event_whenkeypressed: PropTypes.bool,
            event_whenstageclicked: PropTypes.bool,
            event_whenthisspriteclicked: PropTypes.bool,
            event_whenbackdropswitchesto: PropTypes.bool,
            event_whengreaterthan: PropTypes.bool,
            event_whenbroadcastreceived: PropTypes.bool,
            event_broadcast: PropTypes.bool,
            event_broadcastandwait: PropTypes.bool,
        }),
        control: PropTypes.shape({
            showcontrolCategory: PropTypes.bool,
            control_wait: PropTypes.bool,
            control_repeat: PropTypes.bool,
            control_forever: PropTypes.bool,
            control_if: PropTypes.bool,
            control_if_else: PropTypes.bool,
            control_wait_until: PropTypes.bool,
            control_repeat_until: PropTypes.bool,
            control_stop: PropTypes.bool,
            control_create_clone_of: PropTypes.bool,
            control_start_as_clone: PropTypes.bool,
            control_delete_this_clone: PropTypes.bool,
        }),
        sensing: PropTypes.shape({
            showsensingCategory: PropTypes.bool,
            sensing_touchingobject: PropTypes.bool,
            sensing_touchingcolor: PropTypes.bool,
            sensing_coloristouchingcolor: PropTypes.bool,
            sensing_distanceto: PropTypes.bool,
            sensing_askandwait: PropTypes.bool,
            sensing_answer: PropTypes.bool,
            sensing_keypressed: PropTypes.bool,
            sensing_mousedown: PropTypes.bool,
            sensing_mousex: PropTypes.bool,
            sensing_mousey: PropTypes.bool,
            sensing_setdragmode: PropTypes.bool,
            sensing_loudness: PropTypes.bool,
            sensing_timer: PropTypes.bool,
            sensing_resettimer: PropTypes.bool,
            sensing_of: PropTypes.bool,
            sensing_current: PropTypes.bool,
            sensing_dayssince2000: PropTypes.bool,
            sensing_username: PropTypes.bool,
        }),
        operators: PropTypes.shape({
            showoperatorsCategory: PropTypes.bool,
            operator_add: PropTypes.bool,
            operator_subtract: PropTypes.bool,
            operator_multiply: PropTypes.bool,
            operator_divide: PropTypes.bool,
            operator_random: PropTypes.bool,
            operator_gt: PropTypes.bool,
            operator_lt: PropTypes.bool,
            operator_equals: PropTypes.bool,
            operator_and: PropTypes.bool,
            operator_or: PropTypes.bool,
            operator_not: PropTypes.bool,
            operator_join: PropTypes.bool,
            operator_letter_of: PropTypes.bool,
            operator_length: PropTypes.bool,
            operator_contains: PropTypes.bool,
            operator_mod: PropTypes.bool,
            operator_round: PropTypes.bool,
            operator_mathop: PropTypes.bool,
        }),
        variables: PropTypes.shape({
            showvariablesCategory: PropTypes.bool,
            variables_myvariable: PropTypes.bool,
            variables_setto: PropTypes.bool,
            variables_changeby: PropTypes.bool,
            variables_showvariable: PropTypes.bool,
            variables_hidevariable: PropTypes.bool,
        }),
        myblocks: PropTypes.shape({
            showmyblocksCategory: PropTypes.bool,
            myblocks_makeablock: PropTypes.bool,
        }),
    }).isRequired,
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number,
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool,
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    theme: PropTypes.oneOf(Object.keys(themeMap)),
    toolboxXML: PropTypes.string,
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    useCatBlocks: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object),
    }),
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE,
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: "#ddd",
    },
    comments: true,
    collapse: false,
    sounds: false,
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions,
    theme: DEFAULT_THEME,
    // currentLMSPreferences: []
};

const mapStateToProps = (state) => {
    // Log the entire state for debugging
    console.log('Redux State:', state);
    const currentLMSPreferences = state.scratchGui.LMStoScratch?.projectData?.SelectBlock || [];
    console.log("blocks prefences in blocks.jsx from lms", currentLMSPreferences)
    // Access and log specific values you are mapping to props
    const currentPreferences = state.scratchGui.selectBlocks;
    const anyModalVisible =
        Object.keys(state.scratchGui.modals).some(
            (key) => state.scratchGui.modals[key]
        ) || state.scratchGui.mode.isFullScreen;
    const extensionLibraryVisible = state.scratchGui.modals.extensionLibrary;
    const isRtl = state.locales.isRtl;
    const locale = state.locales.locale;
    const messages = state.locales.messages;
    const toolboxXML = state.scratchGui.toolbox.toolboxXML;
    const customProceduresVisible = state.scratchGui.customProcedures.active;
    const workspaceMetrics = state.scratchGui.workspaceMetrics;
    const useCatBlocks = isTimeTravel2020(state);

    // Log the mapped values
    // console.log('Mapped Values from redux state:', {
    //     currentPreferences,
    //     anyModalVisible,
    //     extensionLibraryVisible,
    //     isRtl,
    //     locale,
    //     messages,
    //     toolboxXML,
    //     customProceduresVisible,
    //     workspaceMetrics,
    //     useCatBlocks,
    // });

    return {
        currentLMSPreferences,
        currentPreferences,
        anyModalVisible,
        extensionLibraryVisible,
        isRtl,
        locale,
        messages,
        toolboxXML,
        customProceduresVisible,
        workspaceMetrics,
        useCatBlocks,
    };
};

const mapDispatchToProps = (dispatch) => ({
    onActivateColorPicker: (callback) =>
        dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) =>
        dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: (id) => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: (data) => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: (toolboxXML) => {
        dispatch(updateToolbox(toolboxXML));
    },
    updateMetrics: (metrics) => {
        dispatch(updateMetrics(metrics));
    },
});

export default errorBoundaryHOC("Blocks")(
    connect(mapStateToProps, mapDispatchToProps)(Blocks)
);
