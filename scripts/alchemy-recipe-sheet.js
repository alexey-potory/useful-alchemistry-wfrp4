import {getDataAttribute} from "./_shared/utils.js";

export class AlchemyRecipeSheet extends ItemSheetWfrp4e {
    get template() {
        return `modules/useful-alchemistry-wfrp4/templates/recipe/alchemy-recipe.hbs`;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('#success-result-container').on('drop', this._onSuccessResultAdd.bind(this));
        html.find('#fail-result-container').on('drop', this._onFailResultAdd.bind(this));

        html.find('#ingredients-list').on('drop', this._onIngredientAdd.bind(this));
        html.find(".ingredient-delete").click(this._onIngredientDelete.bind(this));

        html.find("#success-result-delete").click(this._onSuccessResultDelete.bind(this));
        html.find("#fail-result-delete").click(this._onFailResultDelete.bind(this));
    }

    async _onIngredientDelete(ev) {
        const index = getDataAttribute(ev, "index");

        const ingredients = this.currentData.system.ingredients;

        ingredients.splice(index, 1);
        await this.currentData.update({"system.ingredients": ingredients});
    }

    async _onSuccessResultDelete(ev) {
        await this.currentData.update({"system.result.success": ""});
    }

    async _onFailResultDelete(ev) {
        await this.currentData.update({"system.result.fail": ""});
    }

    async _onIngredientAdd(ev) {
        ev.preventDefault();

        const itemId = await this._getItemIdFromEvent(ev);

        if (!itemId) {
            return;
        }

        const ingredients = this.currentData.system.ingredients || [];

        ingredients.push(itemId);
        await this.currentData.update({"system.ingredients": ingredients});
    }

    async _onSuccessResultAdd(ev) {
        ev.preventDefault();

        const itemId = await this._getItemIdFromEvent(ev);

        if (!itemId) {
            return;
        }

        await this.currentData.update({"system.result.success": itemId});
    }

    async _onFailResultAdd(ev) {
        ev.preventDefault();

        const itemId = await this._getItemIdFromEvent(ev);

        if (!itemId) {
            return;
        }

        await this.currentData.update({"system.result.fail": itemId});
    }

    async _getItemIdFromEvent(ev) {
        const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));

        if (data.type !== "Item") {
            await ui.notifications.warn(game.i18n.localize("ALCHEMY_RECIPE.Warning_OnlyItems"));
            return null;
        }

        const item = await fromUuid(data.uuid);
        return item._id;
    }

    async getData(options) {
        const data = await super.getData();
        this.currentData = data.document;

        data.system = data.item._source.system;

        const ingredients = data.system.ingredients;
        const ingredientItems = ingredients?.map(id => game.items.get(id));

        const successId = data.system.result.success;
        const failId = data.system.result.fail;

        data.result = {
            success: game.items.find(item => item._id === successId),
            fail: game.items.find(item => item._id === failId)
        }

        data.items = {
            inventory: {
                categories: {
                    cargo: {
                        label: game.i18n.localize("WFRP4E.TrappingType.Cargo"),
                        items: ingredientItems,
                        show: true,
                        dataType: "cargo"
                    }
                }
            }
        };
        return data;
    }
}