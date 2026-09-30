import JSZip from 'jszip';

const handleDownload = async (project) => {
    // If there's only Python code
    if (project.codeContent?.python && !project.codeContent?.html && !project.codeContent?.js) {
        const blob = new Blob([project.codeContent.python], { type: "text/plain" });
        downloadFile(blob, `${project.name}.py`);
        return;
    }

    // If there's only JavaScript code
    if (project.codeContent?.js && !project.codeContent?.html && !project.codeContent?.python) {
        const blob = new Blob([project.codeContent.js], { type: "text/plain" });
        downloadFile(blob, `${project.name}.js`);
        return;
    }

    // If there's only HTML/CSS
    if (project.codeContent?.html && !project.codeContent?.python && !project.codeContent?.js) {
        // Create a blob that includes both HTML and CSS
        const htmlContent = project.codeContent.html.replace('</head>', 
            `<style>${project.codeContent.css || ''}</style></head>`);
        const blob = new Blob([htmlContent], { type: "text/html" });
        downloadFile(blob, `${project.name}.html`);
        return;
    }

    // If there are multiple files, create a zip
    const zip = new JSZip();

    // Add files to zip if they exist
    if (project.codeContent?.python) {
        zip.file(`${project.name}.py`, project.codeContent.python);
    }

    if (project.codeContent?.js) {
        zip.file(`${project.name}.js`, project.codeContent.js);
    }

    if (project.codeContent?.html) {
        zip.file(`${project.name}.html`, project.codeContent.html);
    }

    if (project.codeContent?.css) {
        zip.file(`${project.name}.css`, project.codeContent.css);
    }

    // Generate and download zip file
    try {
        const content = await zip.generateAsync({ type: "blob" });
        downloadFile(content, `${project.name}.zip`);
    } catch (error) {
        console.error("Error creating zip file:", error);
    }
};

// Helper function to handle the actual download
const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

export default handleDownload;