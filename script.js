// Configurer marked.js pour respecter les retours à la ligne simples
marked.setOptions({
    breaks: true, // Convertit les \n simples en <br>
    gfm: true // Active le GitHub Flavored Markdown pour une meilleure compatibilité
});

// Sélecteurs DOM
const moduleSelect = document.getElementById("module-select");
const chapterSelect = document.getElementById("chapter-select");
const chapterContent = document.getElementById("chapter-content");
const courseOutline = document.getElementById("course-outline");

// Structure pour stocker les données du cours
let courseData = [];

// Charger le fichier Markdown
fetch("formation.md")
    .then(response => response.text())
    .then(data => {
        parseMarkdown(data);
        populateModuleSelect();
        populateCourseOutline();
        updateChapters(0);
    })
    .catch(error => console.error("Erreur lors du chargement du Markdown :", error));

// Parser le Markdown pour extraire modules et chapitres
function parseMarkdown(markdownText) {
    const lines = markdownText.split("\n");
    let currentModule = null;
    let currentChapter = null;
    let chapterContentLines = [];
    let skipNextEmptyLine = false; // Indicateur pour ignorer les lignes vides après un titre

    lines.forEach((line, index) => {
        if (line.startsWith("# ")) {
            if (currentModule && currentChapter && chapterContentLines.length > 0) {
                currentChapter.content = renderContent(chapterContentLines.join("\n"));
                chapterContentLines = [];
            }
            currentModule = {
                title: line.replace("# ", "").trim(),
                chapters: []
            };
            courseData.push(currentModule);
            currentChapter = null;
            skipNextEmptyLine = true; // Prépare à ignorer la ligne vide suivante
        } else if (line.startsWith("## ") && currentModule) {
            if (currentChapter && chapterContentLines.length > 0) {
                currentChapter.content = renderContent(chapterContentLines.join("\n"));
                chapterContentLines = [];
            }
            currentChapter = {
                title: line.replace("## ", "").trim(),
                content: ""
            };
            currentModule.chapters.push(currentChapter);
            skipNextEmptyLine = true; // Prépare à ignorer la ligne vide suivante
        } else if (currentChapter) {
            if (skipNextEmptyLine && line.trim() === "") {
                // Ignore la ligne vide juste après un titre
                skipNextEmptyLine = false;
            } else {
                chapterContentLines.push(line);
                skipNextEmptyLine = false; // Réinitialise après avoir traité une ligne non vide
            }
        }

        if (index === lines.length - 1 && currentChapter && chapterContentLines.length > 0) {
            currentChapter.content = renderContent(chapterContentLines.join("\n"));
        }
    });
}

// Fonction pour rendre le contenu avec prise en charge des vidéos YouTube
function renderContent(markdownText) {
    const youtubeRegex = /!\[youtube\]\(([\w-]{11})\)/g;
    const modifiedMarkdown = markdownText.replace(youtubeRegex, (_, videoId) => {
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    });
    return marked.parse(modifiedMarkdown);
}

// Remplir le sélecteur de modules
function populateModuleSelect() {
    courseData.forEach((module, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = module.title;
        moduleSelect.appendChild(option);
    });
}

// Remplir le sélecteur de chapitres en fonction du module
function updateChapters(moduleIndex) {
    chapterSelect.innerHTML = "";
    const chapters = courseData[moduleIndex].chapters;
    chapters.forEach((chapter, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = chapter.title;
        chapterSelect.appendChild(option);
    });
    updateContent(moduleIndex, 0);
}

// Mettre à jour le contenu affiché
function updateContent(moduleIndex, chapterIndex) {
    const chapter = courseData[moduleIndex].chapters[chapterIndex];
    chapterContent.innerHTML = chapter.content;
}

// Générer la liste des modules et chapitres dans le pied de page
function populateCourseOutline() {
    courseOutline.innerHTML = "";
    courseData.forEach((module, moduleIndex) => {
        const moduleTitle = document.createElement("h3");
        moduleTitle.textContent = module.title;
        courseOutline.appendChild(moduleTitle);

        const chapterList = document.createElement("ul");
        module.chapters.forEach((chapter, chapterIndex) => {
            const chapterItem = document.createElement("li");
            const chapterLink = document.createElement("a");
            chapterLink.href = "#";
            chapterLink.textContent = chapter.title;
            chapterLink.addEventListener("click", (e) => {
                e.preventDefault();
                moduleSelect.value = moduleIndex;
                updateChapters(moduleIndex);
                chapterSelect.value = chapterIndex;
                updateContent(moduleIndex, chapterIndex);
            });
            chapterItem.appendChild(chapterLink);
            chapterList.appendChild(chapterItem);
        });
        courseOutline.appendChild(chapterList);
    });
}

// Événements
moduleSelect.addEventListener("change", (e) => {
    updateChapters(e.target.value);
});

chapterSelect.addEventListener("change", (e) => {
    updateContent(moduleSelect.value, e.target.value);
});