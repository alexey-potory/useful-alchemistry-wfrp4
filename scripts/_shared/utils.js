export function getDataAttribute(ev, property) {
    let value = ev.target.dataset[property];

    if (!value) {
        const parent = $(ev.target).parents(`[data-${property}]`);
        if (parent) {
            value = parent[0]?.dataset[property];
        }
    }
    return value;
}

export function areArraysValuesEqual(array1, array2) {
    // Check if lengths are equal
    if (array1.length !== array2.length) return false;

    // Sort and compare each element
    const sortedArray1 = array1.slice().sort();
    const sortedArray2 = array2.slice().sort();

    for (let i = 0; i < sortedArray1.length; i++) {
        if (sortedArray1[i] !== sortedArray2[i]) return false;
    }

    return true;
}

export async function getActor() {
    const potentialActors = game.user.isGM ? game.actors : [game.user.character];

    if (!potentialActors || potentialActors.length === 0) {
        return ui.notifications.warn(game.i18n.localize("ALCHEMY_UTILS.NoAvailableCharacter"));
    }

    let actor;
    if (potentialActors.length === 1) {
        actor = potentialActors[0];
    } else {
        actor = await _chooseActorDialog(potentialActors);
        if (!actor) return ui.notifications.warn(game.i18n.localize("ALCHEMY_UTILS.NoCharacterSelected"));
    }

    return actor;
}

async function _chooseActorDialog(actors) {
    return new Promise(async (resolve) => {

        const content = await renderTemplate("modules/useful-alchemistry-wfrp4/templates/_shared/actor-select.hbs", {actors: actors});

        new Dialog({
            title: game.i18n.localize("ALCHEMY_UTILS.SelectCharacterHeader"),
            content,
            buttons: {
                ok: {
                    label: game.i18n.localize("ALCHEMY_UTILS.SelectCharacterSubmitButton"),
                    callback: (html) => {
                        const actorId = html.find("#actor-select").val();
                        resolve(game.actors.get(actorId));
                    }
                },
                cancel: {
                    label: game.i18n.localize("ALCHEMY_UTILS.SelectCharacterCancelButton"),
                    callback: () => resolve(null)
                }
            },
            default: "ok"
        }).render(true);
    });
}