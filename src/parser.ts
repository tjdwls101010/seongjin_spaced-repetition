import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/Question";

export let debugParser = false;

export interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string;
    clozePatterns: string[];
    enableSectionBasedCards?: boolean;
    sectionFrontHeading?: string;
    sectionBackHeading?: string;
}

export function setDebugParser(value: boolean) {
    debugParser = value;
}

export class ParsedQuestionInfo {
    cardType: CardType;
    text: string;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;

    constructor(cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) {
        this.cardType = cardType;
        this.text = text;
        this.firstLineNum = firstLineNum;
        this.lastLineNum = lastLineNum;
    }

    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }
}

function markerInsideCodeBlock(text: string, marker: string, markerIndex: number): boolean {
    let goingBack = markerIndex - 1,
        goingForward = markerIndex + marker.length;
    let backTicksBefore = 0,
        backTicksAfter = 0;

    while (goingBack >= 0) {
        if (text[goingBack] === "`") backTicksBefore++;
        goingBack--;
    }

    while (goingForward < text.length) {
        if (text[goingForward] === "`") backTicksAfter++;
        goingForward++;
    }

    // If there's an odd number of backticks before and after,
    //  the marker is inside an inline code block
    return backTicksBefore % 2 === 1 && backTicksAfter % 2 === 1;
}

function hasInlineMarker(text: string, marker: string): boolean {
    // No marker provided
    if (marker.length == 0) return false;

    // Check if the marker is in the text
    const markerIdx = text.indexOf(marker);
    if (markerIdx === -1) return false;

    // Check if it's inside an inline code block
    return !markerInsideCodeBlock(text, marker, markerIdx);
}

/**
 * Parses section-based flashcard from text
 *
 * @param text - The full text to search for sections
 * @param frontHeading - The heading marking the front of the card (e.g., "# Front")
 * @param backHeading - The heading marking the back of the card (e.g., "# Back")
 * @returns ParsedQuestionInfo if valid section card found, null otherwise
 */
function parseSectionBasedCard(
    text: string,
    frontHeading: string,
    backHeading: string,
): ParsedQuestionInfo | null {
    if (!frontHeading || !backHeading || frontHeading.length === 0 || backHeading.length === 0) {
        return null;
    }

    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");

    // Find the FIRST occurrence of front heading
    let frontStartLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === frontHeading) {
            frontStartLine = i;
            break;
        }
    }

    if (frontStartLine === -1) {
        return null; // Front heading not found
    }

    // Find the FIRST occurrence of back heading
    let backStartLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === backHeading) {
            backStartLine = i;
            break;
        }
    }

    if (backStartLine === -1) {
        return null; // Back heading not found
    }

    // Ensure front heading comes before back heading
    if (frontStartLine >= backStartLine) {
        return null; // Front heading must come before back heading
    }

    // Extract front section content (from front heading to next level-1 heading or back heading)
    let frontEndLine = -1;
    for (let i = frontStartLine + 1; i < lines.length; i++) {
        // Check if it's a level-1 heading (starts with "# " but not "##")
        if (lines[i].startsWith("# ") && !lines[i].startsWith("## ")) {
            frontEndLine = i - 1;
            break;
        }
    }

    // If no next heading found, front section ends just before back heading
    if (frontEndLine === -1) {
        frontEndLine = backStartLine - 1;
    }

    // Extract back section content (from back heading to next level-1 heading or EOF)
    let backEndLine = lines.length - 1;
    for (let i = backStartLine + 1; i < lines.length; i++) {
        // Check if it's a level-1 heading (starts with "# " but not "##")
        if (lines[i].startsWith("# ") && !lines[i].startsWith("## ")) {
            backEndLine = i - 1;
            break;
        }
        // Check if this is the section-based scheduling comment - exclude it from content
        if (lines[i].trim().startsWith("<!--SR-SECTION:")) {
            backEndLine = i - 1;
            break;
        }
    }

    // Validate that sections have content
    // Front section: lines from frontStartLine to frontEndLine
    const frontLines = lines.slice(frontStartLine, frontEndLine + 1);
    const frontContent = frontLines.join("\n");

    // Back section: lines from backStartLine to backEndLine
    const backLines = lines.slice(backStartLine, backEndLine + 1);
    const backContent = backLines.join("\n");

    // Check if front section has content beyond the heading
    const frontContentWithoutHeading = frontLines.slice(1).join("\n").trim();
    if (frontContentWithoutHeading.length === 0) {
        return null; // Front section is empty
    }

    // Check if back section has content beyond the heading
    const backContentWithoutHeading = backLines.slice(1).join("\n").trim();
    if (backContentWithoutHeading.length === 0) {
        return null; // Back section is empty
    }

    // Combine sections with delimiter
    const combinedText = frontContent + "\n---SECTION-BREAK---\n" + backContent;

    return new ParsedQuestionInfo(
        CardType.SectionBased,
        combinedText,
        frontStartLine,
        backEndLine,
    );
}

/**
 * Returns flashcards found in `text`
 *
 * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
 *
 * @param text - The text to extract flashcards from
 * @param ParserOptions - Parser options
 * @returns An array of parsed question information
 */
export function parse(text: string, options: ParserOptions): ParsedQuestionInfo[] {
    if (debugParser) {
        console.log("Text to parse:\n<<<" + text + ">>>");
    }

    // Sort inline separators by length, longest first
    const inlineSeparators = [
        { separator: options.singleLineCardSeparator, type: CardType.SingleLineBasic },
        { separator: options.singleLineReversedCardSeparator, type: CardType.SingleLineReversed },
    ];
    inlineSeparators.sort((a, b) => b.separator.length - a.separator.length);

    const cards: ParsedQuestionInfo[] = [];
    let cardText = "";
    let cardType: CardType | null = null;
    let firstLineNo = 0,
        lastLineNo = 0;

    const clozecrafter = new ClozeCrafter(options.clozePatterns);
    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i],
            currentTrimmed = lines[i].trim();

        // Skip everything in HTML comments
        if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
            i++;
            continue;
        }

        // Have we reached the end of a card?
        const isEmptyLine = currentTrimmed.length == 0;
        const hasMultilineCardEndMarker =
            options.multilineCardEndMarker && currentTrimmed == options.multilineCardEndMarker;
        if (
            // We've probably reached the end of a card
            (isEmptyLine && !options.multilineCardEndMarker) ||
            // Empty line & we're not picking up any card
            (isEmptyLine && cardType == null) ||
            // We've reached the end of a multi line card &
            //  we're using custom end markers
            hasMultilineCardEndMarker
        ) {
            if (cardType) {
                // Create a new card
                lastLineNo = i - 1;
                cards.push(
                    new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo),
                );
                cardType = null;
            }

            cardText = "";
            firstLineNo = i + 1;
            continue;
        }

        // Update card text
        if (cardText.length > 0) {
            cardText += "\n";
        }
        cardText += currentLine.trimEnd();

        // Pick up inline cards
        for (const { separator, type } of inlineSeparators) {
            if (hasInlineMarker(currentLine, separator)) {
                cardType = type;
                break;
            }
        }

        if (cardType == CardType.SingleLineBasic || cardType == CardType.SingleLineReversed) {
            cardText = currentLine;
            firstLineNo = i;

            // Pick up scheduling information if present
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }

            lastLineNo = i;
            cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));

            cardType = null;
            cardText = "";
        } else if (currentTrimmed === options.multilineCardSeparator) {
            // Ignore card if the front of the card is empty
            if (cardText.length > 1) {
                // Pick up multiline basic cards
                cardType = CardType.MultiLineBasic;
            }
        } else if (currentTrimmed === options.multilineReversedCardSeparator) {
            // Ignore card if the front of the card is empty
            if (cardText.length > 1) {
                // Pick up multiline basic cards
                cardType = CardType.MultiLineReversed;
            }
        } else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
            // Pick up codeblocks
            const codeBlockClose = currentLine.match(/`+|~+/)[0];
            while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + codeBlockClose;
            i++;
        } else if (cardType === null && clozecrafter.isClozeNote(currentLine)) {
            // Pick up cloze cards
            cardType = CardType.Cloze;
        }
    }

    // Do we have a card left in the queue?
    if (cardType && cardText) {
        lastLineNo = lines.length - 1;
        cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
    }

    // Parse section-based card if enabled
    if (options.enableSectionBasedCards && options.sectionFrontHeading && options.sectionBackHeading) {
        const sectionCard = parseSectionBasedCard(
            text,
            options.sectionFrontHeading,
            options.sectionBackHeading,
        );
        if (sectionCard) {
            cards.push(sectionCard);
        }
    }

    if (debugParser) {
        console.log("Parsed cards:\n", cards);
    }

    return cards;
}
