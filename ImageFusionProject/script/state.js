export let imageIndex = 0;
export const imageOpacities = {};
export const imagePositions = {};
export const imageMergingMethods = {};
export const imageWeights = {}; // ✅ Added for per-image weighted merging

// Getter and Setter for imageIndex
export function getImageIndex() {
    return imageIndex;
}
export function setImageIndex(index) {
    imageIndex = index;
}

// Getter and Setter for imageOpacities
export function getImageOpacities() {
    return imageOpacities;
}
export function setImageOpacity(id, value) {
    imageOpacities[id] = value;
}

// Getter and Setter for imagePositions
export function getImagePositions() {
    return imagePositions;
}
export function setImagePosition(id, pos) {
    imagePositions[id] = pos;
}

export function resetImagePositions() {
    for (const key in imagePositions) {
        delete imagePositions[key];
    }
}

// Getter and Setter for imageMergingMethods
export function getImageMergingMethods() {
    return imageMergingMethods;
}
export function setImageMergingMethod(key, value) {
    imageMergingMethods[key] = value;
}

// ✅ NEW: Getter and Setter for per-image weights
export function getImageWeights() {
    return imageWeights;
}
export function setImageWeight(id, value) {
    imageWeights[id] = value;
}
