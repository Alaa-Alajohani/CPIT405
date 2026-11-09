const COOKIE_DAYS = 365;
const COOKIE_OPTIONS = "; expires={expires}; path=/; SameSite=Lax";

const likeCount = document.getElementById("like-count");
const dislikeCount = document.getElementById("dislike-count");
const likeButton = document.getElementById("like-button");
const dislikeButton = document.getElementById("dislike-button");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const commentSubmit = document.getElementById("comment-submit");
const commentsList = document.getElementById("comments-list");

function getCookie(name) {
    const cookie = document.cookie.split("; ").find(item => item.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function setCookie(name, value) {
    const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}${COOKIE_OPTIONS.replace("{expires}", expires)}`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function readCookieJSON(name, defaultValue) {
    const value = getCookie(name);
    if (value === null) return defaultValue;

    try {
        return JSON.parse(value);
    } catch {
        return defaultValue;
    }
}

let counts = readCookieJSON("lab6-counts", { like: 0, dislike: 0 });
if (!Number.isFinite(counts.like) || !Number.isFinite(counts.dislike)) {
    counts = { like: 0, dislike: 0 };
}

let comments = readCookieJSON("lab6-comments", []);
if (!Array.isArray(comments)) comments = [];

function renderComments() {
    commentsList.replaceChildren();

    comments.forEach(comment => {
        const item = document.createElement("div");
        const text = document.createElement("p");
        item.className = "comment-item";
        text.textContent = comment.text;
        item.appendChild(text);
        commentsList.appendChild(item);
    });
}

function updatePage() {
    const vote = getCookie("lab6-vote");
    const hasVoted = vote === "like" || vote === "dislike";

    likeCount.textContent = counts.like;
    dislikeCount.textContent = counts.dislike;
    likeButton.disabled = hasVoted;
    dislikeButton.disabled = hasVoted;
    likeButton.setAttribute("aria-pressed", String(vote === "like"));
    dislikeButton.setAttribute("aria-pressed", String(vote === "dislike"));

    const hasCommented = comments.length > 0;
    commentInput.disabled = !hasVoted || hasCommented;
    commentSubmit.disabled = !hasVoted || hasCommented || !commentInput.value.trim();
    renderComments();
}

function castVote(choice) {
    if (getCookie("lab6-vote")) return;

    counts[choice] += 1;
    setCookie("lab6-counts", JSON.stringify(counts));
    setCookie("lab6-vote", choice);
    updatePage();
}

likeButton.addEventListener("click", () => castVote("like"));
dislikeButton.addEventListener("click", () => castVote("dislike"));

commentInput.addEventListener("input", () => {
    const hasVoted = Boolean(getCookie("lab6-vote"));
    commentSubmit.disabled = !hasVoted || comments.length > 0 || !commentInput.value.trim();
});

commentForm.addEventListener("submit", event => {
    event.preventDefault();
    const vote = getCookie("lab6-vote");
    const text = commentInput.value.trim();

    if (!vote || !text || comments.length > 0) return;

    comments = [{ text, vote }];
    setCookie("lab6-comments", JSON.stringify(comments));
    commentInput.value = "";
    updatePage();
});

document.getElementById("clear-comments").addEventListener("click", () => {
    deleteCookie("lab6-comments");
    comments = [];
    updatePage();
});

document.getElementById("reset-button").addEventListener("click", () => {
    deleteCookie("lab6-vote");
    deleteCookie("lab6-counts");
    deleteCookie("lab6-comments");
    counts = { like: 0, dislike: 0 };
    comments = [];
    commentInput.value = "";
    updatePage();
});

updatePage();
