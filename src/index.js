import { shape2path } from "https://cdn.jsdelivr.net/npm/@marmooo/shape2path@0.0.2/+esm";
import svgpath from "https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";
import signaturePad from "https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/+esm";

const courseNode = document.getElementById("course");
const audioContext = new AudioContext();
const audioBufferCache = {};
loadAudio("error", "/plot-icon/mp3/boyon1.mp3");
loadAudio("correct1", "/plot-icon/mp3/pa1.mp3");
loadAudio("correct2", "/plot-icon/mp3/papa1.mp3");
loadAudio("correctAll", "/plot-icon/mp3/levelup1.mp3");
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
}

function changeLang() {
  const langObj = document.getElementById("lang");
  const lang = langObj.options[langObj.selectedIndex].value;
  location.href = `/plot-icon/${lang}/`;
}

function createPath(node) {
  const path = document.createElementNS(svgNamespace, "path");
  for (const attribute of node.attributes) {
    path.setAttribute(attribute.name, attribute.value);
  }
  return path;
}

function isOverlapped(target, rect) {
  return target.some((targetRect) =>
    targetRect.left < rect.right &&
    targetRect.right > rect.left &&
    targetRect.top < rect.bottom &&
    targetRect.bottom > rect.top
  );
}

function getConnectableIndex(prevIndex, dot, pathIndex) {
  const dots = problem[pathIndex].dots;
  const prevDot = dots[prevIndex];
  const z = Number(prevDot.dataset.z);
  if (z) {
    const prevSibling = dots[prevIndex - 1] == dot;
    if (prevSibling) return prevIndex - 1;
  } else {
    const nextSibling = dots[prevIndex + 1] == dot;
    if (nextSibling) return prevIndex + 1;
    const prevSibling = dots[prevIndex - 1] == dot;
    if (prevSibling) return prevIndex - 1;
  }
  return -1;
}

function isSamePosition(rect1, rect2) {
  if (!rect1 || !rect2) return false;
  if (rect1.left == rect2.left && rect1.top && rect2.top) {
    return true;
  } else {
    return false;
  }
}

function handleTextClick(event, text, pathIndex) {
  if (!pad._drawingStroke) return;
  const { clientX, clientY } = event;
  const targets = document.elementsFromPoint(clientX, clientY)
    .filter((node) => node.tagName == "circle");
  const dots = problem[pathIndex].dots;
  const indexes = targets.map((dot) => dots.indexOf(dot))
    .filter((dot) => dot >= 0);
  if (dotIndexes.length == 0) {
    dotIndexes = indexes;
    playAudio("correct1");
    return;
  }
  const dotRoutes = dotIndexes.map((prevIndex) => {
    return indexes.map((index) =>
      getConnectableIndex(prevIndex, dots[index], pathIndex)
    ).filter((index) => indexes.includes(index));
  });
  if (dotRoutes.every((routes) => routes.length == 0)) {
    playAudio("error");
    pad.clear();
    return;
  }
  const currPath = problem[pathIndex].path;
  if (textIndex != 0) currPath.nextElementSibling.remove();
  // text.style.cursor = "initial";
  // text.setAttribute("fill-opacity", 0.5);
  // text.onmouseenter = null;

  const path = createPath(problem[pathIndex].path);
  resetCurrentColor(path);
  path.style.fill = "";
  path.style.stroke = "";
  const data = problem[pathIndex];
  const pathData = data.pathData;

  if (data.drawn.every((status) => status)) {
    path.setAttribute("d", pathData.toString());
    currPath.after(path);

    problem[pathIndex].dots.forEach((prevText) => {
      prevText.remove();
    });
    if (pathIndex + 1 == problem.length) {
      playAudio("correctAll");
    } else {
      playAudio("correct2");
      currPathIndex += 1;
      textIndex = 0;
      problem[currPathIndex].dots.forEach((currDot) => {
        currDot.style.display = "initial";
      });
    }
  } else {
    dotRoutes.forEach((routes, i) => {
      const posFrom = dotIndexes[i];
      routes.forEach((posTo) => {
        const rectsFrom = data.rects[posFrom];
        const rectsTo = data.rects[posTo];
        let segmentPos = Math.max(rectsFrom.i, rectsTo.i);
        if (rectsFrom.z) {
          const x = (rectsFrom.left + rectsFrom.right) / 2;
          const y = (rectsFrom.top + rectsFrom.bottom) / 2;
          pathData.segments[segmentPos] = ["L", x, y];
        } else if (rectsTo.z) {
          const x = (rectsTo.left + rectsTo.right) / 2;
          const y = (rectsTo.top + rectsTo.bottom) / 2;
          pathData.segments[segmentPos] = ["L", x, y];
        } else {
          pathData.segments[segmentPos] = data.d.segments[segmentPos];
        }
        data.drawn[segmentPos] = true;
        while (
          isSamePosition(data.rects[segmentPos], data.rects[segmentPos + 1])
        ) {
          data.drawn[segmentPos + 1] = true;
          segmentPos += 1;
        }
      });
    });
    const newPathData = new svgpath.from(data.pathData);
    path.setAttribute("d", newPathData.toString());
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "gray");
    currPath.after(path);
    pad.clear();
    playAudio("correct1");
    textIndex += 1;
  }
  dotIndexes = indexes;
}

function addNumber(x, y, r, z, pathIndex, display) {
  const text = document.createElementNS(svgNamespace, "circle");
  text.setAttribute("cx", x + r);
  text.setAttribute("cy", y + r);
  text.setAttribute("r", r);
  text.setAttribute("fill", "currentColor");
  if (z) text.setAttribute("data-z", z);
  text.style.display = display;
  text.style.cursor = "pointer";
  text.textContent = Math.random();
  text.onmouseenter = (event) => handleTextClick(event, text, pathIndex);
  text.onmousedown = (event) => {
    pad._strokeBegin(event);
    handleTextClick(event, text, pathIndex);
  };
  text.ontouchstart = (event) => {
    pad._strokeBegin(event);
    handleTextClick(event, text, pathIndex);
  };
  svg.appendChild(text);
  return text;
}

function getPoints(pathData) {
  const points = [];
  let x = 0;
  let y = 0;
  let n = 0;
  pathData.segments.forEach((segment, i) => {
    switch (segment[0]) {
      case "H":
        x = segment[1];
        points.push([x, y, null]);
        break;
      case "h":
        x += segment[1];
        points.push([x, y, null]);
        break;
      case "V":
        y = segment[1];
        points.push([x, y, null]);
        break;
      case "v":
        y += segment[1];
        points.push([x, y, null]);
        break;
      case "M":
      case "L":
      case "C":
      case "S":
      case "Q":
      case "T":
      case "A":
        x = segment.at(-2);
        y = segment.at(-1);
        points.push([x, y, null]);
        break;
      case "m":
      case "l":
      case "c":
      case "s":
      case "q":
      case "t":
      case "a":
        x += segment.at(-2);
        y += segment.at(-1);
        points.push([x, y, null]);
        break;
      case "Z":
      case "z":
        x = points[n][0];
        y = points[n][1];
        points.push([x, y, n]);
        n = i + 1;
        break;
    }
  });
  return points;
}

function initPoints(points, pathData) {
  let x = 0;
  let y = 0;
  let n = 0;
  pathData.segments.forEach((segment, i) => {
    switch (segment[0]) {
      case "H":
        pathData.segments[i] = ["M", segment[1], y];
        x = segment[1];
        break;
      case "h":
        pathData.segments[i] = ["m", segment[1], 0];
        x += segment[1];
        break;
      case "V":
        pathData.segments[i] = ["M", x, segment[1]];
        y = segment[1];
        break;
      case "v":
        pathData.segments[i] = ["m", 0, segment[1]];
        y += segment[1];
        break;
      case "M":
        x = segment.at(-2);
        y = segment.at(-1);
        break;
      case "m":
        x += segment.at(-2);
        y += segment.at(-1);
        break;
      case "Z":
      case "z":
        x = points[n][0];
        y = points[n][1];
        pathData.segments[i] = ["M", x, y];
        n = i + 1;
        break;
      default:
        if (/[A-Z]/.test(segment[0])) {
          pathData.segments[i] = ["M", segment.at(-2), segment.at(-1)];
          x = segment.at(-2);
          y = segment.at(-1);
        } else {
          pathData.segments[i] = ["m", segment.at(-2), segment.at(-1)];
          x += segment.at(-2);
          y += segment.at(-1);
        }
    }
  });
  return pathData;
}

function getRects(points, r, skipThreshold) {
  const rects = [];
  let px = -Infinity;
  let py = -Infinity;
  let reduced = 0;
  points.forEach(([x, y, z], i) => {
    const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    // if (skipThreshold < distance) {
    const zPos = (z != null) ? z - reduced : z;
    const rect = {
      left: x - r,
      top: y - r,
      right: x + r,
      bottom: y + r,
      i,
      z: zPos,
    };
    rects.push(rect);
    px = x;
    py = y;
    // } else {
    //   reduced += 1;
    // }
  });
  console.log(rects);
  return rects;
}

function initDrawnStatus(segments) {
  const drawn = new Array(segments.length);
  for (let i = 0; i < segments.length; i++) {
    if (/[Mm]/.test(segments[i][0])) {
      drawn[i] = true;
    } else {
      drawn[i] = false;
    }
  }
  return drawn;
}

function addDots(r) {
  const viewBox = getViewBox(svg);
  const skipThreshold = viewBox[3] * skipFactor;
  let index = 1;
  problem.forEach((data, pathIndex) => {
    const pathData = svgpath(data.path.getAttribute("d"));
    const points = getPoints(pathData);
    const rects = getRects(points, r, skipThreshold);

    const dots = [];
    const display = (pathIndex == 0) ? "initial" : "none";
    rects.forEach((rect) => {
      const text = addNumber(
        rect.left,
        rect.top,
        r,
        rect.z,
        pathIndex,
        display,
      );
      dots.push(text);
      index += 1;
    });
    pathData.abs();

    data.rects = rects;
    data.dots = dots;
    data.d = new svgpath.from(pathData);
    data.pathData = initPoints(points, pathData);
    data.drawn = initDrawnStatus(data.d.segments);
  });
}

function getTransforms(node) {
  const transforms = [];
  while (node.tagName) {
    const transform = node.getAttribute("transform");
    if (transform) transforms.push(transform);
    node = node.parentNode;
  }
  return transforms.reverse();
}

function removeTransforms(svg) {
  for (const path of svg.getElementsByTagName("path")) {
    const d = path.getAttribute("d");
    const transforms = getTransforms(path);
    if (transforms.length > 0) {
      const newD = svgpath(d);
      transforms.forEach((transform) => {
        newD.transform(transform);
      });
      path.setAttribute("d", newD.toString());
    }
  }
  for (const node of svg.querySelectorAll("[transform]")) {
    node.removeAttribute("transform");
  }
}

function removeUseTags(svg) {
  const uses = [...svg.getElementsByTagName("use")];
  for (const use of uses) {
    let id = use.getAttributeNS(xlinkNamespace, "href").slice(1);
    if (!id) id = use.getAttribute("href").slice(1); // SVG 2
    if (!id) continue;
    const g = svg.getElementById(id).cloneNode(true);
    for (const attribute of use.attributes) {
      if (attribute.localName == "href") continue;
      g.setAttribute(attribute.name, attribute.value);
    }
    g.removeAttribute("id");
    use.replaceWith(g);
  }
}

// https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units
function lengthToPixel(str) {
  const x = parseFloat(str);
  switch (str.slice(0, -2)) {
    case "cm":
      return x / 96 * 2.54;
    case "mm":
      return x / 96 * 254;
    case "in":
      return x / 96;
    case "pc":
      return x * 16;
    case "pt":
      return x / 96 * 72;
    case "px":
      return x;
    default:
      return x;
  }
}

function getDotSize(svg) {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const width = Number(viewBox.split(" ")[2]);
    return width / 80;
  } else {
    const width = lengthToPixel(svg.getAttribute("width"));
    return width / 80;
  }
}

function getViewBox(svg) {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    return viewBox.split(" ").map(Number);
  } else {
    const width = lengthToPixel(svg.getAttribute("width"));
    const height = lengthToPixel(svg.getAttribute("height"));
    return [0, 0, width, height];
  }
}

function setViewBox(svg) {
  const viewBox = getViewBox(svg);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  problem.forEach((data) => {
    data.rects.forEach((rect) => {
      const { left, top, right, bottom } = rect;
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (maxX < right) maxX = right;
      if (maxY < bottom) maxY = bottom;
    });
  });
  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.ceil(maxX);
  maxY = Math.ceil(maxY);
  const viewBoxMaxX = viewBox[0] + viewBox[2];
  const viewBoxMaxY = viewBox[1] + viewBox[3];
  if (viewBox[0] < minX) minX = viewBox[0];
  if (viewBox[1] < minY) minY = viewBox[1];
  if (maxX < viewBoxMaxX) maxX = viewBoxMaxX;
  if (maxY < viewBoxMaxY) maxY = viewBoxMaxY;
  viewBox[0] = minX;
  viewBox[1] = minY;
  viewBox[2] = maxX - minX;
  viewBox[3] = maxY - minY;
  svg.setAttribute("viewBox", viewBox.join(" "));
}

function hideIcon() {
  problem.forEach((data) => {
    const path = data.path;
    path.style.fill = "none";
    path.style.stroke = "none";
  });
}

async function fetchIconList(course) {
  const response = await fetch(`/plot-icon/data/${course}.txt`);
  const text = await response.text();
  return text.trimEnd().split("\n");
}

async function fetchIcon(url) {
  url = "/svg/phosphor-icons/regular/door.svg";
  const response = await fetch(url);
  const svg = await response.text();
  return new DOMParser().parseFromString(svg, "image/svg+xml");
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
const presentationAttributes = new Set([
  "alignment-baseline",
  "baseline-shift",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "cursor",
  // "d",
  "direction",
  "display",
  "dominant-baseline",
  "enable-background",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "image-rendering",
  "kerning",
  "letter-spacing",
  "lighting-color",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mask",
  "opacity",
  "overflow",
  "pointer-events",
  "shape-rendering",
  "solid-color",
  "solid-opacity",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "transform",
  "unicode-bidi",
  "vector-effect",
  "visibility",
  "word-spacing",
  "writing-mode",
]);

function removeSvgTagAttributes(svg) {
  const candidates = [];
  [...svg.attributes].forEach((attribute) => {
    if (presentationAttributes.has(attribute.name)) {
      candidates.push(attribute);
      svg.removeAttribute(attribute.name);
    }
  });
  if (candidates.length > 0) {
    const g = document.createElementNS(svgNamespace, "g");
    candidates.forEach((attribute) => {
      g.setAttribute(attribute.name, attribute.value);
    });
    [...svg.children].forEach((node) => {
      g.appendChild(node);
    });
    svg.appendChild(g);
  }
}

function fixIconCode(svg) {
  const course = courseNode.options[courseNode.selectedIndex].value;
  if (course == "Solar-icon-set") {
    for (const node of svg.querySelectorAll("[fill=black]")) {
      node.setAttribute("fill", "gray");
    }
    for (const node of svg.querySelectorAll("[stroke=black]")) {
      node.setAttribute("stroke", "gray");
    }
  }
}

function computeAttribute(node, attributeName) {
  let attributeValue;
  while (!attributeValue && node && node.tagName) {
    attributeValue = node.getAttribute(attributeName);
    node = node.parentNode;
  }
  return attributeValue;
}

function resetCurrentColor(node) {
  const fill = computeAttribute(node, "fill");
  const stroke = computeAttribute(node, "stroke");
  if (fill && fill.toLowerCase() == "currentcolor") {
    node.setAttribute("fill", "gray");
  }
  if (stroke && stroke.toLowerCase() == "currentcolor") {
    node.setAttribute("stroke", "gray");
  }
}

function styleAttributeToAttributes(svg) {
  [...svg.querySelectorAll("[style]")].forEach((node) => {
    node.getAttribute("style").split(";").forEach((style) => {
      const [property, value] = style.split(":").map((str) => str.trim());
      if (presentationAttributes.has(property)) {
        node.setAttribute(property, value);
        node.style.removeProperty(property);
      }
    });
  });
}

async function nextProblem() {
  textIndex = 0;
  currPathIndex = 0;
  const courseNode = document.getElementById("course");
  const course = courseNode.options[courseNode.selectedIndex].value;
  if (iconList.length == 0) {
    iconList = await fetchIconList(course);
  }
  const filePath = iconList[getRandomInt(0, iconList.length)];
  const url = `/svg/${course}/${filePath}`;
  const icon = await fetchIcon(url);
  svg = icon.documentElement;
  const tehon = svg.cloneNode(true);
  tehon.style.width = "100%";
  tehon.style.height = "100%";

  svg.addEventListener("mousedown", (event) => pad._strokeBegin(event));
  svg.addEventListener("mousemove", (event) => pad._strokeUpdate(event));
  svg.addEventListener("mouseup", () => {
    pad.clear();
    dotIndexes = [];
  });
  svg.addEventListener("touchstart", (event) => pad._strokeBegin(event));
  svg.addEventListener("touchmove", (event) => pad._strokeUpdate(event));
  svg.addEventListener("touchend", () => {
    pad.clear();
    dotIndexes = [];
  });

  fixIconCode(svg);
  styleAttributeToAttributes(svg);
  if (!svg.getAttribute("fill")) svg.setAttribute("fill", "gray");
  resetCurrentColor(svg);
  removeSvgTagAttributes(svg);
  shape2path(svg, createPath, { circleAlgorithm: "QuadBezier" });
  removeUseTags(svg);
  removeTransforms(svg);
  problem = [];
  [...svg.getElementsByTagName("path")].forEach((path) => {
    problem.push({ path });
  });
  hideIcon(svg);
  addDots(getDotSize(svg));
  setViewBox(svg);

  svg.style.width = "100%";
  svg.style.height = "100%";
  const targets = document.querySelectorAll("#problems .iconContainer");
  targets[0].replaceChildren(tehon);
  targets[1].replaceChildren(svg);
}

async function changeCourse() {
  const course = courseNode.options[courseNode.selectedIndex].value;
  iconList = await fetchIconList(course);
  selectAttribution(courseNode.selectedIndex);
  nextProblem();
}

function selectRandomCourse() {
  const index = getRandomInt(0, courseNode.options.length);
  courseNode.options[index].selected = true;
  selectAttribution(index);
}

function selectAttribution(index) {
  const divs = [...document.getElementById("attribution").children];
  divs.forEach((div, i) => {
    if (i == index) {
      div.classList.remove("d-none");
    } else {
      div.classList.add("d-none");
    }
  });
}

const svgNamespace = "http://www.w3.org/2000/svg";
const xlinkNamespace = "http://www.w3.org/1999/xlink";
const skipFactor = 0.05;
let dotIndexes = [];
let textIndex = 0;
let currPathIndex = 0;
let svg;
let problem;
let iconList = [];

const canvas = document.getElementById("canvas");
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
const pad = new signaturePad(canvas, {
  minWidth: 3,
  maxWidth: 3,
  throttle: 0,
  minDistance: 0,
});

selectRandomCourse();
nextProblem();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("lang").onchange = changeLang;
document.getElementById("startButton").onclick = nextProblem;
courseNode.onclick = changeCourse;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
