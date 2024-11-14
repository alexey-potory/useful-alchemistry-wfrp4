export class AlchemyRecipeModel extends BaseWarhammerItemModel {
    // noinspection JSUnusedGlobalSymbols
    static defineSchema() {
        let fields$F = foundry.data.fields;

        return {
            description: new fields$F.SchemaField({
                value: new fields$F.StringField()
            }),
            gmdescription: new fields$F.SchemaField({
                value: new fields$F.StringField()
            }),
            ingredients: new fields$F.ArrayField(new fields$F.StringField()),
            result: new fields$F.SchemaField({
                success: new fields$F.StringField(),
                fail: new fields$F.StringField()
            }),
            difficultyModifier: new fields$F.NumberField()
        }
    }

    async _preCreate(data, options, user)
    {
        await super._preCreate(data, options, user);

        if (!data.img || data.img == "icons/svg/item-bag.svg")
        {
            this.parent.updateSource({img : "modules/useful-alchemistry-wfrp4/art/icons/craft-recipe-icon.png"});
        }
    }
}