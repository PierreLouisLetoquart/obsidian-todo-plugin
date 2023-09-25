import SmartAssistantPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SmartAssistantPluginSettingTab extends PluginSettingTab {
	plugin: SmartAssistantPlugin;

	constructor(app: App, plugin: SmartAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("OpenAi API Key")
			.setDesc("Your API key to use the OpenAi's models")
			.addText((text) =>
				text
					.setPlaceholder("your-api-key")
					.setValue(this.plugin.settings.openAiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openAiApiKey = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
