import React, { useRef, useState } from "react";
import { Typography, Box, Divider, Grid, Button } from "@mui/material";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from "docx";
import { saveAs } from "file-saver";
import { useTheme } from "@mui/material/styles";
import { X } from "lucide-react"

const QuestionPaper = ({
    title,
    instruction,
    totalMarks,
    selectedChapters,
    selectedCourse,
    totalTime,
    questionsGenerated,
}) => {

    console.log("Received props in QuestionPaper:", questionsGenerated)
    const contentRef = useRef(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

   
    const handleDownload = async () => {
        // helper function to strip HTML and handle null/undefined/non-string values
        const stripHtml = (value) => {
            if (value == null) return "";
            return String(value).replace(/<[^>]*>/g, '');
        };

        const sections = questionsGenerated.map((section, sectionIndex) => {
            const children = [
                ...(sectionIndex === 0 ? [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: title, bold: true, size: 32 })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: `${selectedChapters.map(c => c.name).join(", ")}`, bold: true })]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Total marks: ${totalMarks}`, bold: true }),
                            new TextRun({ text: "\t\t\t\t\t\t\t\t" }),
                            new TextRun({ text: `Time: ${totalTime} minutes`, bold: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                            new TextRun({ text: "Instruction: ", bold: true }),
                            new TextRun({ text: instruction })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [new TextRun({ text: "" })]
                    }),
                ] : []),
                new Paragraph({
                    pageBreakBefore: sectionIndex !== 0,
                    heading: HeadingLevel.HEADING_2,
                    children: [
                        new TextRun({
                            text: `Section ${sectionIndex + 1}: ${section[0]?.questionType || "No questions available"}`,
                            bold: true,
                            size: 28
                        })
                    ]
                }),
                ...section.flatMap((question, questionIndex) => {
                    const paragraphs = [
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Q.${questionIndex + 1}: `, bold: true }),
                                new TextRun({ text: stripHtml(question.questionStem) })
                            ],
                            spacing: { before: 200 }
                        }),
                        ...(question.options?.map((option, optionIndex) =>
                            new Paragraph({
                                indent: { left: 720 },
                                children: [
                                    new TextRun({
                                        text: `${String.fromCharCode(65 + optionIndex)}) ${stripHtml(option.option)}`
                                    })
                                ],
                                spacing: { before: 100 }
                            })
                        ) || []),
                    ];

                    // Answer Key logic
                    if (question.answerKey != null) {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Answer Key: ", bold: true }),
                                    new TextRun({ text: stripHtml(question.answerKey) })
                                ],
                                spacing: { before: 100 }
                            })
                        );
                    }
                    // Answer logic (handles boolean true/false)
                    else if (question.answer != null) {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Answer: ", bold: true }),
                                    new TextRun({ text: String(question.answer) }) // safe for true/false
                                ],
                                spacing: { before: 100 }
                            })
                        );
                    }

                    // Explanation logic (skip for short answer types)
                    if (!["Very Short Answer", "Short Answer", "Long Answer"].includes(question.questionType)) {
                        if (question.explanation != null) {
                            paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: "Explanation: ", bold: true }),
                                        new TextRun({ text: stripHtml(question.explanation) })
                                    ],
                                    spacing: { before: 100 }
                                })
                            );
                        }
                    }

                    return paragraphs;
                })
            ];

            return {
                properties: {},
                children
            };
        });

        const doc = new Document({ sections });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${title}.docx`);
    };
    const handleDownloadWithoutAnswer = async () => {
        const sections = questionsGenerated.map((section, sectionIndex) => {
            const children = [
                ...(sectionIndex === 0 ? [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: title, bold: true, size: 32 })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: `${selectedChapters.map(c => c.name).join(", ")}`, bold: true })]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Total marks: ${totalMarks}`, bold: true }),
                            new TextRun({ text: "\t\t\t\t\t\t\t\t" }),
                            new TextRun({ text: `Time: ${totalTime} minutes`, bold: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                            new TextRun({ text: "Instruction: ", bold: true }),
                            new TextRun({ text: instruction })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [new TextRun({ text: "" })]
                    }),
                ] : []),
                new Paragraph({
                    pageBreakBefore: sectionIndex !== 0,
                    heading: HeadingLevel.HEADING_2,
                    children: [
                        new TextRun({
                            text: `Section ${sectionIndex + 1}: ${section[0]?.questionType || "No questions available"}`,
                            bold: true,
                            size: 28
                        })
                    ]
                }),
                ...section.flatMap((question, questionIndex) => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Q.${questionIndex + 1}: `, bold: true }),
                            new TextRun({ text: question.questionStem.replace(/<[^>]*>/g, '') })
                        ],
                        spacing: { before: 200 }
                    }),
                    ...(question.options?.map((option, optionIndex) =>
                        new Paragraph({
                            indent: { left: 720 },
                            children: [
                                new TextRun({
                                    text: `${String.fromCharCode(65 + optionIndex)}) ${option.option.replace(/<[^>]*>/g, '')}`
                                })
                            ],
                            spacing: { before: 100 }
                        })
                    ) || [])
                ])
            ];

            return {
                properties: {},
                children
            };
        });

        const doc = new Document({ sections });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${title}.docx`);
    };


    // JSX remains unchanged
    const displayChapters = () => {
        const chaptersArray = selectedChapters.map((every) => every.name);
        return chaptersArray.join(", ");
    };

    return (
        <Box
    ref={contentRef}
    p={3}
    sx={{
        bgcolor: isDark ? "#1f1f1f" : "#f5f7fa",
        color: isDark ? "#fff" : "#000",
        borderRadius: 2,
        minHeight: "100vh",

        "& .MuiTypography-root": {
            color: isDark ? "#fff" : "#000",
        },

        "& strong": {
            color: isDark ? "#fff" : "#000",
        },

        "& span": {
            color: isDark ? "#fff" : "#000",
        },

        "& hr": {
            borderColor: isDark ? "#555" : "#ccc",
        },
    }}
>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom textAlign="center">{title}</Typography>
                <Typography
    variant="subtitle1"
    sx={{
        color: isDark ? "#cfcfcf" : "#555",
    }}
>{instruction}</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body1"><strong>Total marks:</strong> {totalMarks}</Typography>
                    <Typography variant="body1"><strong>Time:</strong> {totalTime} minutes</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                    <Typography variant="body1"><strong>Course:</strong> {selectedCourse.name}</Typography>
                    <Typography variant="body1"><strong>Chapters:</strong> {displayChapters()}</Typography>
                </Box>
            </Box>

            {questionsGenerated.map((section, sectionIndex) => (
                <Box key={sectionIndex} sx={{ p: 3 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Section {sectionIndex + 1} : {section.length !== 0 ? section[0].questionType : "No questions available"}
                    </Typography>

                    {section.length !== 0 && (
                        <Box>
                            {section.map((question, questionIndex) => (
                                <Box key={questionIndex} sx={{ mb: 2 }}>
                                    <Typography variant="body1" gutterBottom sx={{ display: "flex" }}>
                                        <strong>Q.{questionIndex + 1}:</strong>
                                        <span style={{ marginLeft: "10px" }} dangerouslySetInnerHTML={{ __html: question.questionStem }} />
                                    </Typography>


                                    {question.options && (
                                        <Grid container spacing={2}>
                                            {question.options.map((option, optionIndex) => (
                                                <Grid item xs={12} sm={6} key={optionIndex}>
                                                    <Box sx={{ display: "flex" }}>
                                                        <Typography variant="body2" sx={{ mr: 1 }}>{String.fromCharCode(65 + optionIndex)}</Typography>
                                                        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: option.option }} />
                                                    </Box>

                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}

                                    {question.answerKey ?
                                        (
                                            <Typography variant="body1" gutterBottom sx={{ display: "flex" }}>
                                                <strong>Answer Key:</strong>
                                                <span style={{ marginLeft: "10px", }} dangerouslySetInnerHTML={{ __html: question.answerKey }} />
                                            </Typography>
                                        ) :
                                        (
                                            <Typography variant="body1" gutterBottom sx={{ display: "flex", mt: "20px" }}>
                                                <strong>Answer:</strong>
                                                <span style={{ marginLeft: "10px" }} dangerouslySetInnerHTML={{ __html: question.answer }} />
                                            </Typography>
                                        )}

                                    {["Very Short Answer", "Short Answer", "Long Answer"].includes(question.questionType) ? null : (
                                        <Typography variant="body1" gutterBottom sx={{ display: "flex", }}>
                                            <strong>explanation:</strong>
                                            <span style={{ marginLeft: "10px" }} dangerouslySetInnerHTML={{ __html: question.explanation }} />
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            ))}

            <div className="flex justify-center align-items-center gap-2">
                <Button variant="contained" color="primary" onClick={handleDownload}>Download With Answers</Button>
                <Button variant="contained" color="primary" onClick={handleDownloadWithoutAnswer}>Download Without Answers</Button>
            </div>


        </Box>
    );
};

export default QuestionPaper;
