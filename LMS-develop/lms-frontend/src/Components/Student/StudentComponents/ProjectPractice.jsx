import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import * as React from "react";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import CreatePracticeProject from "./ViewPracticeProject";
import ListOfPracticeSavedProject from "./ListOfPracticeSavedProject";


const project = {
    "_id": {
        "$oid": "674ac468209c3904e96ea189"
    },
    "name": "Enter the Title",
    "description": "Enter  description",
    "terminalOptions": [
        "html",
        "python",
        "javascript",
        "Scratch",
        "arduino"
    ],
    "codeContent": {
        "html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Document</title>\n    <style></style>\n</head>\n<body>\n    <h1>Hello, HTML!</h1>\n    <!-- Try adding more HTML elements here -->\n</body>\n</html>",
        "css": "/* Try changing the color, font size, and background color below */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f4f4f4;\n}\n\nh1 {\n    color: #333;\n    font-size: 24px;\n}",
        "js": "// Try writing some code below\nconsole.log(\"Hello, JavaScript!\");",
        "python": "# Try writing some code below\nprint(\"Hello, Python!\")",
        "arduino": `void setup() {

}

void loop() {

}`,
        "Scratch": {
            // if you capture .sb3 or json from Scratch, store here
            sb3Base64: null,
            meta: null
        }
    },

}
export default function ProjectPractice() {
    const { setBreadcrumbTrail } = React.useContext(BreadcrumbContext);
    const [value, setValue] = React.useState("1");

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    React.useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Student Dashboard', path: '/Student-dashboard' },
            { name: 'Porject Tabs', path: '/admin-dashboard/Project-tabs' }
        ]);
    }, []);
    return (
        <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList
                        onChange={handleChange}
                        aria-label="lab API tabs example"
                    >
                        <Tab label="Saved Project" value="1" />
                        <Tab label="Create Project" value="2" />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    {/* <AllQuizzes /> <ListOfPracticeSavedProject/>  here i need a list of all saved project*/}
                    <ListOfPracticeSavedProject />
                </TabPanel>
                <TabPanel value="2">
                    {/* <CreateQuiz />  here  we can create project*/}
                    <CreatePracticeProject project={project} ShowButtons={true} />

                </TabPanel>
            </TabContext>
        </Box>
    );
}
