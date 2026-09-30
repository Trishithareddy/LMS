//lmstoscratch hoc file important
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import axios from 'axios';
import { setProjectData } from '../reducers/LMStoScratch';

const LMStoScratchHOC = function (WrappedComponent) {
    class LMStoScratchWrapper extends React.Component {
        hasLoadedOnce = false;
        lastProjectId = null;
        constructor(props) {
            super(props);
            this.state = {
                isLoading: true,
                error: null,
                projectLoaded: false
            };
        }

        getTokenFromUrl() {
            const urlSearchParams = new URLSearchParams(window.location.search);
            return urlSearchParams.get('token');
        }

        getProjectIdFromUrl() {
            const pathParts = window.location.pathname.split('/');
            return pathParts[1];
        }

        // async loadProjectFromURL(url) {
        //     try {
        //         console.log("Starting project load from URL");
        //         const response = await fetch(url);
        //         if (!response.ok) {
        //             throw new Error('Failed to fetch project file');
        //         }
        //         const projectData = await response.arrayBuffer();

        //         // Clear existing project/sprites before loading new one
        //         if (this.props.vm.clear) {
        //             this.props.vm.clear();
        //         }

        //         await this.props.vm.loadProject(projectData);
        //         console.log("Project loaded successfully from URL");
        //         this.setState({ projectLoaded: true });
        //     } catch (error) {
        //         console.error("Error loading project from URL:", error);
        //         throw error;
        //     }
        // }
        async loadProjectFromURL(url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch project file');

            const buf = await res.arrayBuffer();

            // Replace whatever is running with the sb3
            this.props.vm.stopAll();
            await this.props.vm.loadProject(buf);

            // Focus editor on the first sprite in the loaded project
            const firstSprite = this.props.vm.runtime.targets.find(t => !t.isStage);
            if (firstSprite) this.props.vm.setEditingTarget(firstSprite.id);

            // Optional: if some other HOC created an empty placeholder sprite, remove it
            const sprites = this.props.vm.runtime.targets.filter(t => !t.isStage);
            if (sprites.length > 1) {
                const emptySprites = sprites.filter(t => {
                    const b = t.blocks;
                    return !b || (typeof b.getBlockIds === 'function' && b.getBlockIds().length === 0);
                });
                emptySprites.forEach(t => this.props.vm.deleteSprite(t.id));
            }

            this.setState({ projectLoaded: true });
        }


        // async fetchProjectData() {
        //     const projectId = this.getProjectIdFromUrl();
        //     const token = this.getTokenFromUrl();

        //     console.log('LMStoScratchHOC - Fetching data for project:', projectId);

        //     if (projectId && token && projectId !== 'demo') {
        //         try {
        //             const response = await axios.get(
        //                 `http://localhost:5000/scratch/get-scratch-by-id/${projectId}`,
        //                 {
        //                     headers: {
        //                         Authorization: `Bearer ${token}`
        //                     }
        //                 }
        //             );

        //             if (response.data.data && this.props.vm) {
        //                 // Wait for VM initialization
        //                 await new Promise(resolve => setTimeout(resolve, 1000));

        //                 // Load project file first if available
        //                 if (response.data.data.ScratchFile) {
        //                     try {
        //                         // Clear any existing state before loading
        //                         if (this.props.vm.clear) {
        //                             this.props.vm.clear();
        //                         }

        //                         await this.loadProjectFromURL(response.data.data.ScratchFile);

        //                         // Only set project data after successful project load
        //                         console.log("Setting project data:", response.data.data);
        //                         this.props.onSetProjectData(response.data.data);
        //                     } catch (projectError) {
        //                         console.error('Error loading project file:', projectError);
        //                     }
        //                 } else {
        //                     // If no project file, just set the data
        //                     this.props.onSetProjectData(response.data.data);
        //                 }

        //                 this.setState({ 
        //                     isLoading: false,
        //                     projectLoaded: true 
        //                 });
        //                 return response.data.data;
        //             }
        //         } catch (error) {
        //             console.error('LMStoScratchHOC - Error fetching project:', error);
        //             this.setState({ 
        //                 error: error.message,
        //                 isLoading: false 
        //             });
        //             throw error;
        //         }
        //     }
        //     this.setState({ isLoading: false });
        //     return null;
        // }
        async fetchProjectData() {
            const projectId = this.getProjectIdFromUrl();
            const token = this.getTokenFromUrl();

            if (!projectId || !token || projectId === 'demo') {
                this.setState({ isLoading: false });
                return null;
            }

            // If we already loaded this id, don't load again
            if (this.hasLoadedOnce && this.lastProjectId === projectId) {
                this.setState({ isLoading: false, projectLoaded: true });
                return null;
            }

            try {
                const response = await axios.get(
                    `http://localhost:5000/scratch/get-scratch-by-id/${projectId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = response?.data?.data;
                if (!data) {
                    this.setState({ isLoading: false });
                    return null;
                }

                // load sb3 if present (this REPLACES the runtime)
                if (data.ScratchFile) {
                    await this.loadProjectFromURL(data.ScratchFile);
                }

                // ⬇️ IMPORTANT: do not inject starter blocks when an sb3 exists
                const metaForRedux = data.ScratchFile ? { ...data, SelectBlock: [] } : data;
                this.props.onSetProjectData(metaForRedux);

                this.hasLoadedOnce = true;
                this.lastProjectId = projectId;
                this.setState({ isLoading: false, projectLoaded: true });
                return data;
            } catch (err) {
                console.error('LMStoScratchHOC - Error fetching project:', err);
                this.setState({ error: err.message, isLoading: false });
                throw err;
            }
        }


        // componentDidMount() {
        //     if (this.props.vm) {
        //         this.initializeProject();
        //     }
        // }
        componentDidMount() {
            setTimeout(() => {
                if (this.props.vm) this.fetchProjectData();
            }, 500);
        }


        initializeProject = async () => {
            await new Promise(resolve => setTimeout(resolve, 500)); // Ensure VM is ready
            this.fetchProjectData();
        };

        // 
        componentDidUpdate(prevProps) {
            const currentId = this.getProjectIdFromUrl();
            if (this._lastId !== currentId) {
                this._lastId = currentId;
                this.hasLoadedOnce = false;      // allow a fresh load for the new id
                this.lastProjectId = null;
                if (this.props.vm) this.fetchProjectData();
            }
        }

        render() {
            const { isLoading, error, projectLoaded } = this.state;

            if (error) {
                console.error('LMStoScratchHOC - Render Error:', error);
                return <div>Error loading project: {error}</div>;
            }

            if (isLoading && !projectLoaded) {
                return (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        fontSize: '1.2rem'
                    }}>
                        Loading project...
                    </div>
                );
            }

            return <WrappedComponent {...this.props} />;
        }
    }

    LMStoScratchWrapper.propTypes = {
        vm: PropTypes.shape({
            loadProject: PropTypes.func,
            clear: PropTypes.func,
            renderer: PropTypes.shape({
                draw: PropTypes.func
            })
        }),
        onSetProjectData: PropTypes.func.isRequired,
        projectData: PropTypes.shape({
            ScratchFile: PropTypes.string,
            SelectBlock: PropTypes.array,
            ScratchDescription: PropTypes.string,
            ScratchInstruction: PropTypes.string,
            ScratchTitle: PropTypes.string,
            createdAt: PropTypes.string,
            _id: PropTypes.string
        })
    };

    const mapStateToProps = state => ({
        vm: state.scratchGui.vm,
        projectData: state.scratchGui.LMStoScratch?.projectData
    });

    const mapDispatchToProps = dispatch => ({
        onSetProjectData: data => dispatch(setProjectData(data))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(LMStoScratchWrapper);
};

export default LMStoScratchHOC;