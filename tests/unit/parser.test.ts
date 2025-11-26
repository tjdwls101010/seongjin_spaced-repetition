import { parse, ParsedQuestionInfo, setDebugParser } from "src/parser";
import { ParserOptions } from "src/parser";
import { CardType } from "src/Question";

const parserOptions: ParserOptions = {
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    multilineCardEndMarker: "",
    clozePatterns: [
        "==[123;;]answer[;;hint]==",
        "**[123;;]answer[;;hint]**",
        "{{[123;;]answer[;;hint]}}",
    ],
};

/**
 * This function is a small wrapper around parse used for testing only.
 *  It generates a parser each time, overwriting the default one.
 * Created when the actual parser changed from returning [CardType, string, number, number] to ParsedQuestionInfo.
 * It's purpose is to minimise changes to all the test cases here during the parser()->parserEx() change.
 */
function parseT(text: string, options: ParserOptions): [CardType, string, number, number][] {
    const list: ParsedQuestionInfo[] = parse(text, options);
    const result: [CardType, string, number, number][] = [];
    for (const item of list) {
        result.push([item.cardType, item.text, item.firstLineNum, item.lastLineNum]);
    }
    return result;
}

test("Test parsing of single line basic cards", () => {
    // standard symbols
    expect(parseT("Question::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer", 0, 0],
    ]);
    expect(parseT("Question::Answer\n<!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer\n<!--SR:!2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("Question::Answer <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("Some text before\nQuestion ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question ::Answer", 1, 1],
    ]);
    expect(parseT("#Title\n\nQ1::A1\nQ2:: A2", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Q1::A1", 2, 2],
        [CardType.SingleLineBasic, "Q2:: A2", 3, 3],
    ]);
    expect(parseT("#flashcards/science Question ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "#flashcards/science Question ::Answer", 0, 0],
    ]);

    // custom symbols
    expect(
        parseT("Question&&Answer", {
            singleLineCardSeparator: "&&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question&&Answer", 0, 0]]);
    expect(
        parseT("Question=Answer", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question=Answer", 0, 0]]);

    // empty string or whitespace character provided
    expect(
        parseT("Question::Answer", {
            singleLineCardSeparator: "",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of single line reversed cards", () => {
    // standard symbols
    expect(parseT("Question:::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer", 0, 0],
    ]);
    expect(parseT("Some text before\nQuestion :::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question :::Answer", 1, 1],
    ]);
    expect(parseT("#Title\n\nQ1:::A1\nQ2::: A2", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Q1:::A1", 2, 2],
        [CardType.SingleLineReversed, "Q2::: A2", 3, 3],
    ]);

    // custom symbols
    expect(
        parseT("Question&&&Answer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: "&&&",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question&&&Answer", 0, 0]]);
    expect(
        parseT("Question::Answer", {
            singleLineCardSeparator: ":::",
            singleLineReversedCardSeparator: "::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question::Answer", 0, 0]]);
    expect(
        parseT("Qn 1?:>Answer.\n\nQn 2?<:>Answer.\n", {
            singleLineCardSeparator: ":>",
            singleLineReversedCardSeparator: "<:>",
            multilineCardSeparator: ";>",
            multilineReversedCardSeparator: "<;>",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([
        [CardType.SingleLineBasic, "Qn 1?:>Answer.", 0, 0],
        [CardType.SingleLineReversed, "Qn 2?<:>Answer.", 2, 2],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question:::Answer", {
            singleLineCardSeparator: ">",
            singleLineReversedCardSeparator: "  ",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of multi line basic cards", () => {
    // standard symbols
    expect(parseT("Question\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parseT("Question\n? \nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parseT("Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", 0, 2],
    ]);
    expect(parseT("Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", 0, 3],
    ]);
    expect(parseT("Question line 1\nQuestion line 2\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question line 1\nQuestion line 2\n?\nAnswer", 0, 3],
    ]);
    expect(parseT("Question\n?\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parseT("#Title\n\nLine0\nQ1\n?\nA1\nAnswerExtra\n\nQ2\n?\nA2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Line0\nQ1\n?\nA1\nAnswerExtra", 2, 6],
        [CardType.MultiLineBasic, "Q2\n?\nA2", 8, 10],
    ]);
    expect(parseT("#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", 0, 3],
    ]);
    expect(
        parseT("Question\n?\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: ["**[123;;]answer[;;hint]**"],
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n?\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["**[123;;]answer[;;hint]**"],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineBasic, "Question 2\n?\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion with empty line after question mark\n?\n\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["**[123;;]answer[;;hint]**"],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [
            CardType.MultiLineBasic,
            "Question with empty line after question mark\n?\n\nAnswer line 1\nAnswer line 2",
            6,
            10,
        ],
    ]);

    // custom symbols
    expect(
        parseT("Question\n@@\nAnswer\n\nsfdg", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n@@\nAnswer", 0, 2]]);

    // empty string or whitespace character provided
    expect(
        parseT("Question\n?\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of multi line reversed cards", () => {
    // standard symbols
    expect(parseT("Question\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer", 0, 2],
    ]);
    expect(parseT("Question line 1\nQuestion line 2\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question line 1\nQuestion line 2\n??\nAnswer", 0, 3],
    ]);
    expect(parseT("Question\n??\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parseT("#Title\n\nLine0\nQ1\n??\nA1\nAnswerExtra\n\nQ2\n??\nA2", parserOptions)).toEqual(
        [
            [CardType.MultiLineReversed, "Line0\nQ1\n??\nA1\nAnswerExtra", 2, 6],
            [CardType.MultiLineReversed, "Q2\n??\nA2", 8, 10],
        ],
    );
    expect(
        parseT("Question\n??\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [
                "==[123;;]answer[;;hint]==",
                "**[123;;]answer[;;hint]**",
                "{{[123;;]answer[;;hint]}}",
            ],
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n??\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: [
                    "==[123;;]answer[;;hint]==",
                    "**[123;;]answer[;;hint]**",
                    "{{[123;;]answer[;;hint]}}",
                ],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineReversed, "Question 2\n??\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);

    // custom symbols
    expect(
        parseT("Question\n@@@\nAnswer\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "@@@",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n@@@\nAnswer", 0, 2]]);
    expect(
        parseT(
            `line 1


line 2

Question 1?
??
Answer to question 1
????
line 3

line 4

Question 2?
??
Answer to question 2
????
Line 5
`,
            {
                singleLineCardSeparator: ":::",
                singleLineReversedCardSeparator: "::::",
                multilineCardSeparator: "??",
                multilineReversedCardSeparator: "???",
                multilineCardEndMarker: "????",
                clozePatterns: [],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1?\n??\nAnswer to question 1", 5, 7],
        [CardType.MultiLineBasic, "Question 2?\n??\nAnswer to question 2", 13, 15],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question\n??\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "\t",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of cloze cards", () => {
    // ==highlights==
    expect(parseT("cloze ==deletion== test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parseT("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("==this== is a ==deletion==\n", parserOptions)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
                "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf ==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==p\ndolor won==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==dolor won=", parserOptions)).toEqual([]);

    // ==highlights== turned off
    expect(
        parseT("cloze ==deletion== test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // **bolded**
    expect(parseT("cloze **deletion** test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parseT("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze **deletion** test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("**this** is a **deletion**\n", parserOptions)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
                "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf **", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **p\ndolor won**", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **dolor won*", parserOptions)).toEqual([]);

    // **bolded** turned off
    expect(
        parseT("cloze **deletion** test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // {{curly}}
    expect(parseT("cloze {{deletion}} test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test", 0, 0],
    ]);
    expect(parseT("cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("{{this}} is a {{deletion}}\n", parserOptions)).toEqual([
        [CardType.Cloze, "{{this}} is a {{deletion}}", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch {{wow}}\n\n" +
                "many text\nsuch surprise {{wow}} more {{text}}\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch {{wow}}", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise {{wow}} more {{text}}\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf {{", parserOptions)).toEqual([]);
    expect(parseT("srdf }}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{p\ndolor won}}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{dolor won}", parserOptions)).toEqual([]);

    // {{curly}} turned off
    expect(
        parseT("cloze {{deletion}} test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**"],
        }),
    ).toEqual([]);

    // custom cloze formats
    // Anki-like pattern
    //  Notice that the single line separators have to be different
    expect(
        parseT("Brazilians speak {{Portuguese::language}}", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: "==",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["{{[123::]answer[::hint]}}"],
        }),
    ).toEqual([[CardType.Cloze, "Brazilians speak {{Portuguese::language}}", 0, 0]]);
    expect(
        parseT(
            "Brazilians speak {{1::Portuguese}}\n\nBrazilians speak {{1::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{1::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{1::Portuguese::language}}", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak {{a::Portuguese}}\n\nBrazilians speak {{a::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{a::Portuguese::language}}", 2, 2],
    ]);

    // Highlighted pattern with hint and sequencer in footnotes
    expect(
        parseT("Brazilians speak ==Portuguese==\n\nBrazilians speak ==Portuguese==^[language]", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
        }),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^1]\n\nBrazilians speak ==Portuguese==^[language][^1]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^1]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^1]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^a]\n\nBrazilians speak ==Portuguese==^[language][^a]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^a]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^a]", 2, 2],
    ]);

    // combo
    expect(parseT("cloze **deletion** test ==another deletion==!", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
    expect(
        parseT(
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nTest 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nHere is some more text.",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["==[123;;]answer[;;hint]=="],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            0,
            7,
        ],
        [
            CardType.Cloze,
            "Test 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            10,
            17,
        ],
    ]);

    // all disabled
    expect(
        parseT("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of a mix of card types", () => {
    expect(
        parseT(
            "# Lorem Ipsum\n\nLorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\nlaoreet vitae enim.\n\n" +
                "Fusce placerat::velit in pharetra gravida\n\n" +
                "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Lorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\n" +
                "laoreet vitae enim.",
            2,
            4,
        ],
        [CardType.SingleLineBasic, "Fusce placerat::velit in pharetra gravida", 6, 6],
        [
            CardType.MultiLineReversed,
            "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            8,
            11,
        ],
    ]);
});

test("Test parsing cards with codeblocks", () => {
    // `inline`
    expect(
        parseT(
            "my inline question containing `some inline code` in it::and this is answer possibly containing `inline` code.",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.SingleLineBasic,
            "my inline question containing `some inline code` in it::and this is answer possibly containing `inline` code.",
            0,
            0,
        ],
    ]);
    expect(parseT("this has some ==`inline`== code", parserOptions)).toEqual([
        [CardType.Cloze, "this has some ==`inline`== code", 0, 0],
    ]);

    // ```block```, no blank lines
    expect(
        parseT(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            0,
            6,
        ],
    ]);

    // ```block```, with blank lines
    expect(
        parseT(
            "How do you ... Python?\n?\n" +
                "```python\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```python\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            0,
            9,
        ],
    ]);

    // nested markdown
    expect(
        parseT(
            "Nested Markdown?\n?\n" +
                "````ad-note\n\n" +
                "```git\n" +
                "+ print('hello')\n" +
                "- print('world')\n" +
                "```\n\n" +
                "~~~python\n" +
                "print('hello world')\n" +
                "~~~\n" +
                "````",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "Nested Markdown?\n?\n" +
                "````ad-note\n\n" +
                "```git\n" +
                "+ print('hello')\n" +
                "- print('world')\n" +
                "```\n\n" +
                "~~~python\n" +
                "print('hello world')\n" +
                "~~~\n" +
                "````",
            0,
            12,
        ],
    ]);
});

test("Test not parsing cards in HTML comments", () => {
    expect(parseT("<!--question::answer test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--question:::answer test-->", parserOptions)).toEqual([]);
    expect(
        parseT("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", parserOptions),
    ).toEqual([]);
    expect(
        parseT(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            parserOptions,
        ),
    ).toEqual([]);
    expect(parseT("<!--cloze ==deletion== test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze **deletion** test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);
    expect(parseT("something something\n<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);

    // cards found outside comment
    expect(
        parseT("something something\n\n<!--cloze {{curly}} test-->\n\na::b", parserOptions),
    ).toEqual([[CardType.SingleLineBasic, "a::b", 4, 4]]);
});

test("Test not parsing 'cards' in codeblocks", () => {
    // block
    expect(parseT("```\nCodeblockq::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(parseT("```\nCodeblockq:::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(
        parseT("# Title\n\n```markdown\nsome ==highlighted text==!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(
        parseT("# Title\n```markdown\nsome **bolded text**!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(parseT("# Title\n\n```\nfoo = {{'a': 2}}\n```\n\nmore!", parserOptions)).toEqual([]);

    // inline
    expect(parseT("`Inlineq::InlineA`", parserOptions)).toEqual([]);
    expect(
        parseT("# Title\n`if (a & b) {}`\nmore!", {
            singleLineCardSeparator: "&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [
                "==[123;;]answer[;;hint]==",
                "**[123;;]answer[;;hint]**",
                "{{[123;;]answer[;;hint]}}",
            ],
        }),
    ).toEqual([]);

    // combo
    expect(
        parseT(
            "Question::Answer\n\n```\nCodeblockq::CodeblockA\n```\n\n`Inlineq::InlineA`\n",
            parserOptions,
        ),
    ).toEqual([[CardType.SingleLineBasic, "Question::Answer", 0, 0]]);
});

describe("Parser debug messages", () => {
    test("Messages disabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(false);

        parse("", parserOptions);
        expect(logSpy).toHaveBeenCalledTimes(0);

        // restore original console error log
        logSpy.mockRestore();
    });

    test("Messages enabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(true);

        parse("", parserOptions);
        expect(logSpy).toHaveBeenCalled();

        // restore original console error log
        logSpy.mockRestore();
    });
});

describe("Section-based flashcard parsing", () => {
    const sectionParserOptions: ParserOptions = {
        ...parserOptions,
        enableSectionBasedCards: true,
        sectionFrontHeading: "# 📋정리",
        sectionBackHeading: "# 💭관련",
    };

    describe("Basic section-based card parsing", () => {
        test("Both sections present with content should create card", () => {
            const text = `# 📋정리
이것은 앞면 내용입니다.

# 💭관련
이것은 뒷면 내용입니다.`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].cardType).toBe(CardType.SectionBased);
            expect(result[0].text).toContain("# 📋정리");
            expect(result[0].text).toContain("# 💭관련");
            expect(result[0].text).toContain("이것은 앞면 내용입니다.");
            expect(result[0].text).toContain("이것은 뒷면 내용입니다.");
            expect(result[0].firstLineNum).toBe(0);
        });

        test("Sections with multi-line content should create card", () => {
            const text = `# 📋정리
첫 번째 줄
두 번째 줄
세 번째 줄

# 💭관련
뒷면 첫 줄
뒷면 둘째 줄`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].cardType).toBe(CardType.SectionBased);
            expect(result[0].text).toContain("첫 번째 줄");
            expect(result[0].text).toContain("세 번째 줄");
            expect(result[0].text).toContain("뒷면 둘째 줄");
        });

        test("Sections with Korean text and emojis should be preserved", () => {
            const text = `# 📋정리
한글 텍스트 🎉

# 💭관련
관련 내용 ✨`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("한글 텍스트 🎉");
            expect(result[0].text).toContain("관련 내용 ✨");
        });
    });

    describe("Missing sections", () => {
        test("Front heading missing should NOT create card", () => {
            const text = `Some content here

# 💭관련
뒷면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Back heading missing should NOT create card", () => {
            const text = `# 📋정리
앞면 내용

Some other content`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Both headings missing should NOT create card", () => {
            const text = `# Some Title
Regular content without section headings`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Empty text should NOT create card", () => {
            const text = "";

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(0);
        });
    });

    describe("Empty sections", () => {
        test("Front heading exists but no content should NOT create card", () => {
            const text = `# 📋정리

# 💭관련
뒷면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Back heading exists but no content should NOT create card", () => {
            const text = `# 📋정리
앞면 내용

# 💭관련`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Both sections with only whitespace should NOT create card", () => {
            const text = `# 📋정리

# 💭관련
   `;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });
    });

    describe("Heading order", () => {
        test("Back heading appears before front heading should NOT create card", () => {
            const text = `# 💭관련
뒷면 내용

# 📋정리
앞면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Front heading on same line as back heading should NOT create card", () => {
            const text = `# 📋정리 # 💭관련
Some content`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });
    });

    describe("Multiple same headings", () => {
        test("Multiple front headings should use FIRST occurrence", () => {
            const text = `# 📋정리
첫 번째 앞면 내용

# 💭관련
뒷면 내용

# 📋정리
두 번째 앞면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("첫 번째 앞면 내용");
            expect(sectionCards[0].text).not.toContain("두 번째 앞면 내용");
        });

        test("Multiple back headings should use FIRST occurrence", () => {
            const text = `# 📋정리
앞면 내용

# 💭관련
첫 번째 뒷면 내용

# 💭관련
두 번째 뒷면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("첫 번째 뒷면 내용");
            expect(sectionCards[0].text).not.toContain("두 번째 뒷면 내용");
        });

        test("Multiple occurrences of both headings should use FIRST of each", () => {
            const text = `# 📋정리
첫 번째 앞면

# 💭관련
첫 번째 뒷면

# 📋정리
두 번째 앞면

# 💭관련
두 번째 뒷면`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("첫 번째 앞면");
            expect(sectionCards[0].text).toContain("첫 번째 뒷면");
        });
    });

    describe("Section boundaries", () => {
        test("Front section content stops at next level-1 heading", () => {
            const text = `# 📋정리
앞면 내용
더 많은 앞면 내용

# Another Level 1 Heading
This should not be included

# 💭관련
뒷면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("앞면 내용");
            expect(sectionCards[0].text).not.toContain("This should not be included");
        });

        test("Front section includes level-2 headings", () => {
            const text = `# 📋정리
앞면 내용
## Level 2 Heading
Level 2 content

# 💭관련
뒷면 내용`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("## Level 2 Heading");
            expect(sectionCards[0].text).toContain("Level 2 content");
        });

        test("Back section extends to EOF when no subsequent heading", () => {
            const text = `# 📋정리
앞면 내용

# 💭관련
뒷면 내용
마지막 줄까지
모든 내용 포함`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("마지막 줄까지");
            expect(sectionCards[0].text).toContain("모든 내용 포함");
            expect(sectionCards[0].lastLineNum).toBe(6);
        });

        test("Back section stops at next level-1 heading", () => {
            const text = `# 📋정리
앞면 내용

# 💭관련
뒷면 내용

# Another Section
This should not be included`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("뒷면 내용");
            expect(sectionCards[0].text).not.toContain("This should not be included");
        });

        test("Back section includes level-2 and level-3 headings", () => {
            const text = `# 📋정리
앞면 내용

# 💭관련
뒷면 내용
## Level 2
### Level 3
Content here`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("## Level 2");
            expect(sectionCards[0].text).toContain("### Level 3");
            expect(sectionCards[0].text).toContain("Content here");
        });
    });

    describe("Content preservation", () => {
        test("Korean text should be preserved", () => {
            const text = `# 📋정리
한국어로 작성된 내용
특수문자: ㄱㄴㄷㄹ

# 💭관련
관련된 한국어 내용`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("한국어로 작성된 내용");
            expect(result[0].text).toContain("특수문자: ㄱㄴㄷㄹ");
            expect(result[0].text).toContain("관련된 한국어 내용");
        });

        test("Emojis in headings should be preserved", () => {
            const text = `# 📋정리
Content with emojis 🎨🎭

# 💭관련
More emoji content 🌟✨`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("📋정리");
            expect(result[0].text).toContain("💭관련");
            expect(result[0].text).toContain("🎨🎭");
            expect(result[0].text).toContain("🌟✨");
        });

        test("Obsidian embeds should be preserved", () => {
            const text = `# 📋정리
![[image.png]]
![[another-note]]

# 💭관련
![[related-image.jpg]]`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("![[image.png]]");
            expect(result[0].text).toContain("![[another-note]]");
            expect(result[0].text).toContain("![[related-image.jpg]]");
        });

        test("Headings should be included in extracted content", () => {
            const text = `# 📋정리
Front content

# 💭관련
Back content`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("# 📋정리");
            expect(result[0].text).toContain("# 💭관련");
        });

        test("Markdown formatting should be preserved", () => {
            const text = `# 📋정리
Bold text without markers
*Italic text*
\`code\`
- List item

# 💭관련
> Quote
[Link](http://example.com)`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("Bold text without markers");
            expect(sectionCards[0].text).toContain("*Italic text*");
            expect(sectionCards[0].text).toContain("`code`");
            expect(sectionCards[0].text).toContain("- List item");
            expect(sectionCards[0].text).toContain("> Quote");
            expect(sectionCards[0].text).toContain("[Link](http://example.com)");
        });

        test("Code blocks should be preserved", () => {
            const text = `# 📋정리
\`\`\`python
def hello():
    print("world")
\`\`\`

# 💭관련
\`\`\`javascript
console.log("test");
\`\`\``;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(1);
            expect(result[0].text).toContain("```python");
            expect(result[0].text).toContain("def hello()");
            expect(result[0].text).toContain("```javascript");
            expect(result[0].text).toContain('console.log("test")');
        });
    });

    describe("Coexistence with inline cards", () => {
        test("Note with both section-based and inline basic cards should parse both", () => {
            const text = `Question::Answer

# 📋정리
Section front content

# 💭관련
Section back content

Another question::Another answer`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(3);

            const basicCards = result.filter((card) => card.cardType === CardType.SingleLineBasic);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);

            expect(basicCards.length).toBe(2);
            expect(sectionCards.length).toBe(1);
        });

        test("Section content containing :: should not interfere", () => {
            const text = `# 📋정리
This has :: inside the content
But it should not create an inline card

# 💭관련
Another :: in the back section`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);

            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("This has :: inside the content");
            expect(sectionCards[0].text).toContain("Another :: in the back section");
        });

        test("Note with section-based and multiline cards should parse both", () => {
            const text = `Question line 1
?
Answer line 1

# 📋정리
Section front

# 💭관련
Section back

Question line 2
??
Answer line 2`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(3);

            const multilineCards = result.filter(
                (card) =>
                    card.cardType === CardType.MultiLineBasic ||
                    card.cardType === CardType.MultiLineReversed,
            );
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);

            expect(multilineCards.length).toBe(2);
            expect(sectionCards.length).toBe(1);
        });

        test("Note with section-based and cloze cards should parse both", () => {
            const text = `This is a ==cloze deletion==

# 📋정리
Section front

# 💭관련
Section back

Another ==cloze== here`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(3);

            const clozeCards = result.filter((card) => card.cardType === CardType.Cloze);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);

            expect(clozeCards.length).toBe(2);
            expect(sectionCards.length).toBe(1);
        });

        test("Complex note with all card types should parse correctly", () => {
            const text = `# Title

Single line::basic card

Cloze with ==deletion==

Multiline question
?
Multiline answer

# 📋정리
Section front content

# 💭관련
Section back content

Final question::Final answer`;

            const result = parse(text, sectionParserOptions);
            expect(result.length).toBe(5);

            const basicCards = result.filter((card) => card.cardType === CardType.SingleLineBasic);
            const clozeCards = result.filter((card) => card.cardType === CardType.Cloze);
            const multilineCards = result.filter((card) => card.cardType === CardType.MultiLineBasic);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);

            expect(basicCards.length).toBe(2);
            expect(clozeCards.length).toBe(1);
            expect(multilineCards.length).toBe(1);
            expect(sectionCards.length).toBe(1);
        });
    });

    describe("Feature toggle", () => {
        test("When enableSectionBasedCards is false should NOT parse section cards", () => {
            const text = `# 📋정리
Section front content

# 💭관련
Section back content`;

            const disabledOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: false,
                sectionFrontHeading: "# 📋정리",
                sectionBackHeading: "# 💭관련",
            };

            const result = parse(text, disabledOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("When enableSectionBasedCards is undefined should NOT parse section cards", () => {
            const text = `# 📋정리
Section front content

# 💭관련
Section back content`;

            const undefinedOptions: ParserOptions = {
                ...parserOptions,
                sectionFrontHeading: "# 📋정리",
                sectionBackHeading: "# 💭관련",
            };

            const result = parse(text, undefinedOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("When enableSectionBasedCards is true should parse section cards", () => {
            const text = `# 📋정리
Section front content

# 💭관련
Section back content`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });

        test("When enabled but headings not configured should NOT parse section cards", () => {
            const text = `# 📋정리
Section front content

# 💭관련
Section back content`;

            const noHeadingsOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: true,
            };

            const result = parse(text, noHeadingsOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("When enabled with empty heading strings should NOT parse section cards", () => {
            const text = `# 📋정리
Section front content

# 💭관련
Section back content`;

            const emptyHeadingsOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: true,
                sectionFrontHeading: "",
                sectionBackHeading: "",
            };

            const result = parse(text, emptyHeadingsOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });
    });

    describe("Custom heading configurations", () => {
        test("Custom front and back headings should work", () => {
            const text = `# Front
Front content

# Back
Back content`;

            const customOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: true,
                sectionFrontHeading: "# Front",
                sectionBackHeading: "# Back",
            };

            const result = parse(text, customOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).toContain("# Front");
            expect(sectionCards[0].text).toContain("# Back");
        });

        test("Headings without emojis should work", () => {
            const text = `# Question
This is the question

# Answer
This is the answer`;

            const noEmojiOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: true,
                sectionFrontHeading: "# Question",
                sectionBackHeading: "# Answer",
            };

            const result = parse(text, noEmojiOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });

        test("Headings with special characters should work", () => {
            const text = `# [Front]
Front content

# [Back]
Back content`;

            const specialCharOptions: ParserOptions = {
                ...parserOptions,
                enableSectionBasedCards: true,
                sectionFrontHeading: "# [Front]",
                sectionBackHeading: "# [Back]",
            };

            const result = parse(text, specialCharOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });
    });

    describe("Edge cases", () => {
        test("Section with scheduling comment should not include it", () => {
            const text = `# 📋정리
Front content

# 💭관련
Back content
<!--SR-SECTION:!2023-01-01,1,230-->`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
            expect(sectionCards[0].text).not.toContain("<!--SR-SECTION:");
        });

        test("Sections separated by multiple blank lines should work", () => {
            const text = `# 📋정리
Front content


# 💭관련
Back content`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });

        test("Windows line endings should work", () => {
            const text = "# 📋정리\r\nFront content\r\n\r\n# 💭관련\r\nBack content";

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });

        test("Very long section content should work", () => {
            const longContent = "Line\n".repeat(100);
            const text = `# 📋정리
${longContent}

# 💭관련
${longContent}`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });

        test("Section with only heading on last line should NOT create card", () => {
            const text = `# 📋정리
Front content

# 💭관련`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(0);
        });

        test("Front section immediately followed by back section should work", () => {
            const text = `# 📋정리
Front content
# 💭관련
Back content`;

            const result = parse(text, sectionParserOptions);
            const sectionCards = result.filter((card) => card.cardType === CardType.SectionBased);
            expect(sectionCards.length).toBe(1);
        });
    });
});
