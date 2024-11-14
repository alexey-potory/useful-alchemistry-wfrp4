import {AlchemyRecipeModel} from "./scripts/alchemy-recipe-model.js";
import {AlchemyRecipeSheet} from "./scripts/alchemy-recipe-sheet.js";
import {AlchemyTableWindow} from "./scripts/alchemy-table-window.js";

Hooks.on("init", () => {
    Object.assign(CONFIG.Item.dataModels, {
        "useful-alchemistry-wfrp4.recipe": AlchemyRecipeModel
    });

    // register templates parts
    const templatePaths = [
        "modules/useful-alchemistry-wfrp4/templates/recipe/alchemy-recipe-header.hbs",
        "modules/useful-alchemistry-wfrp4/templates/recipe/alchemy-recipe-list.hbs",
        "modules/useful-alchemistry-wfrp4/templates/_shared/items-list.hbs"
    ];

    loadTemplates( templatePaths );

    DocumentSheetConfig.registerSheet(Item, "useful-alchemistry-wfrp4", AlchemyRecipeSheet, {
        types: ["useful-alchemistry-wfrp4.recipe"],
        makeDefault: true
    });
});

// Register Alchemy Window in the game and add a button to open it
Hooks.once('ready', () => {
    game.alchemy = {};

    game.alchemy.alchemyTable = new AlchemyTableWindow();

    // Create a toggle function to open or focus the Alchemy window
    game.alchemy.toggleAlchemyTable = () => {
        if (game.alchemy.alchemyTable.rendered) {
            game.alchemy.alchemyTable.bringToTop();
        } else {
            game.alchemy.alchemyTable.render(true);
        }
    };
});