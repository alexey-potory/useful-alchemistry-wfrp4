import {areArraysValuesEqual, getActor, getDataAttribute} from "./_shared/utils.js";

export class AlchemyTableWindow extends Application {
    constructor(options = {}) {
        super(options);
        this.ingredients = [];
    }

    // Define the default options for your application
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ALCHEMY_TABLE.Header"),
            template: "modules/useful-alchemistry-wfrp4/templates/table/alchemy-table-window.hbs",
            width: 400,
            height: 400,
            resizable: true,
            classes: ['alchemy-table']
        });
    }

    async close(options = {}) {

        for (const item of this.ingredients) {
            await item.update({ "system.quantity.value": item.system.quantity.value + 1 });
        }

        this.ingredients = [];
        return super.close(options);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".ingredient-delete").click(this._onIngredientDelete.bind(this));
        html.find('#ingredients-list').on('drop', this._onIngredientAdd.bind(this));
        html.find('#alchemy-submit').on('click', this._onSubmit.bind(this));
    }

    // Here, you define the data to be passed to the template
    getData(options) {
        return {
            items: this.ingredients
        };
    }

    async _onIngredientAdd(ev) {
        ev.preventDefault();
        const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));

        if (data.type !== "Item")
            return ui.notifications.warn(game.i18n.localize("ALCHEMY_TABLE.Warning_OnlyItems"));

        const item = await fromUuid(data.uuid);

        if (!item.parent) {
            return ui.notifications.warn(game.i18n.localize("ALCHEMY_TABLE.Warning_OnlyInventoryItems"));
        }

        if (item.system.quantity.value > 0) {
            await item.update({ "system.quantity.value": item.system.quantity.value - 1 });
        } else {
            return ui.notifications.warn(game.i18n.localize("ALCHEMY_TABLE.Warning_NotEnoughItems"));
        }

        this.ingredients.push(item);
        this.render(true);
    }

    async _onIngredientDelete(ev) {
        const index = getDataAttribute(ev, "index");
        const item = this.ingredients[index];

        await item.update({ "system.quantity.value": item.system.quantity.value + 1 });

        this.ingredients.splice(index, 1);
        this.render(true);
    }

    async _onSubmit(ev) {
        const ingredientsIds = this.ingredients.map(sourceItem => game.items.find(item => item.name === sourceItem.name)._id);
        const recipes = game.items.filter(item => item.type === "useful-alchemistry-wfrp4.recipe");

        const match = recipes.find(recipe => areArraysValuesEqual(recipe.system.ingredients, ingredientsIds))

        if (!match) {
            this.ingredients = [];
            this.render();
            return await this._postChatMessage(`<b style="color: #ad0000">${game.i18n.localize("ALCHEMY_TABLE.Error_BadRecipe")}</b>`);
        }

        const modifier = match.system.difficultyModifier ?? 0;

        const actor = await getActor();
        const skill = actor.items.find(skill => skill.name === game.i18n.localize("ALCHEMY.Skill"));

        let result;

        if (skill !== undefined) {
            await actor.setupSkill(skill, { fields: {modifier: modifier}}).then(async test => {
                result = await this._performRoll(test);
            });
        } else {
            await actor.setupCharacteristic('int', { fields: {modifier: modifier}}).then(async test => {
                result = await this._performRoll(test);
            });
        }

        let itemToCreate;

        if (result) {
            const id = match.system.result.success;
            itemToCreate = await game.items.find(item => item._id === id);
        } else {
            const id = match.system.result.fail;
            itemToCreate = await game.items.find(item => item._id === id);
        }

        if (itemToCreate) {
            let item = actor.items.find(i => i.name === itemToCreate.name);

            if (item === undefined) {
                const doc = await actor.createEmbeddedDocuments("Item", [itemToCreate.toObject()]);
                item = await doc[0].update({"system.quantity.value": 1});
            } else {
                item = await item.update({"system.quantity.value": item.system.quantity.value + 1});
            }

            let header = result ?
                `<b style="color: #00802a">${game.i18n.localize("ALCHEMY.SuccessMessage")}</b>` :
                `<b style="color: #AD0000FF">${game.i18n.localize("ALCHEMY.FailMessage")}</b>`;

            let body = `${game.i18n.localize("ALCHEMY.RecieveItem")}: @UUID[${item.uuid}]`

            await this._postChatMessage(`${header}<br><p>${body}</p>`)
        } else {
            let header = result ?
                `<b style="color: #00802a">${game.i18n.localize("ALCHEMY.SuccessMessage")}</b>` :
                `<b style="color: #AD0000FF">${game.i18n.localize("ALCHEMY.FailMessage")}</b>`;

            let body = game.i18n.localize("ALCHEMY.NotReceiveItem");
            await this._postChatMessage(`${header}<br><p>${body}</p>`)
        }

        this.ingredients = [];
        this.render();
    }

    async _performRoll(test) {
        try {
            await test.roll();
        } catch (error) {
            if (error.message === "No Active GM present") {
                // ignore (why it's even throwing an Error ffs?)
            }
        }
        return test.succeeded;
    }

    async _postChatMessage(content) {
        await ChatMessage.create({ content: content, speaker: { alias: game.i18n.localize("ALCHEMY_CHAT.SpeakerAlias") }, flags: {img: "modules/useful-alchemistry-wfrp4/art/icons/craft-recipe-icon.png"} });
    }
}