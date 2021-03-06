import fs from "fs";
import marked from "marked";
const mdFileContent = fs.readFileSync("./content.md", "utf-8");

const makeArrayFromMarkdown = (mdFileContent) =>
    marked
    .lexer(mdFileContent) // raw array with many unnecessary fields
    .filter((elem) => elem.type !== "space")
    .map((elem) => {
        const { type, depth, text } = elem;
        const joinedType = depth ? type[0] + depth : type[0];
        return { type: joinedType, text };
    });

const markdownArray = makeArrayFromMarkdown(mdFileContent);
const elementTypesArray = markdownArray.map((elem) => elem.type);
const infoEndIndex = elementTypesArray.indexOf("h2");

const infoArray = markdownArray.slice(0, infoEndIndex);
const chaptersArray = markdownArray.slice(infoEndIndex);

/* const chapters = markdownArray
  .filter((elem) => elem.type === "h2")
  .map((elem) => elem.text.trim()); */

const prefixedIndex = (index) => {
    return index.toString().padStart(3, "0");
};

// object { key: param }
const parseInfo = (text) => {
    const rowsArray = text.split("\n");
    const info = rowsArray.reduce((prev, item) => {
        const [key, value] = item.split(":");
        return {...prev, [key]: value.trim() };
    }, {});
    return info;
};

// object with number keys '001, 002, ...'
const parseParagraph = (pText) => {
    const rowsArray = pText.split("\n");
    const info = rowsArray.reduce((prev, item, index) => {
        const rowIndex = prefixedIndex(index + 1);
        return {...prev, [rowIndex]: { text: item.trim() } };
    }, {});
    return info;
};

const parseInfoArray = (infoArray) => {
    return infoArray.reduce((prev, item) => {
        const { type, text } = item;
        if (type === "h1") return { title: text };
        if (type === "p") return {...prev, ...parseInfo(text) };
    }, {});
};

const parseChaptersArray = (markdownArray) => {
    const chaptersArray = [];
    let chapter = {};
    let subchapterName = "";

    markdownArray.forEach((elem, index, array) => {
        const { type, text } = elem;
        const { type: nextType } = array[index + 1] || {};
        const isEndOfChapter = nextType === "h2" || !array[index + 1];
        if (type === "h2") {
            chapter = { title: text };
        }
        if (type === "h3") {
            subchapterName = text;
        }
        if (type === "p") {
            const subchapter = {
                [subchapterName]: parseParagraph(text)
            };
            chapter = {...chapter, ...subchapter };
        }
        if (isEndOfChapter) {
            chaptersArray.push(chapter);
        }
    });

    const result = chaptersArray.reduce((prev, item, index) => {
        const chapterIndex = prefixedIndex(index + 1);
        return {...prev, [chapterIndex]: item };
    }, {});

    return result;
};

const info = parseInfoArray(infoArray);
const chapters = parseChaptersArray(chaptersArray);

const content = { info, chapters };

// console.log(JSON.stringify(content, null, "\t"));

fs.writeFileSync('./content.js', 'export default ' + JSON.stringify(content, null, "\t"), 'utf-8')