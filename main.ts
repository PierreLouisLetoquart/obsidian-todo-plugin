import OpenAI from "openai";
import { Notice, Plugin } from "obsidian";
import { SmartAssistantPluginSettingTab } from "settings-tab";

interface SmartAssistantPluginSettings {
	openAiApiKey: string;
	systemPrompt: string;
}

const DEFAULT_SETTINGS: Partial<SmartAssistantPluginSettings> = {
	systemPrompt: `create a list of actions to perform based on the selected 
		text, return the list of actions as a string where each action 
		is separated by a new line.
		
		Dont provide an introduction or a conclusion, just the actions to perform, for example:
		1. make some research on Xxxxxx
		2. write a summary of the lesson 2
		3. prepare a mindmap of the topic

		The list of actions should be a simple list of actions, no need to provide any context or explanation, just the actions to perform.
		The list of actions need to be short, no more than 6 actions, and each action should be simple.`,
};

export default class SmartAssistantPlugin extends Plugin {
	settings: SmartAssistantPluginSettings;

	userPrompt: string;
	response: string;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SmartAssistantPluginSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Generate todo list 🌈")
						.setIcon("document")
						.onClick(async () => {
							this.userPrompt = getSelectedText();
							if (
								this.userPrompt == "" ||
								this.userPrompt == null ||
								this.userPrompt == undefined ||
								this.userPrompt.length == 0 ||
								this.userPrompt.length < 2
							) {
								new Notice("No text selected");
								return;
							} else if (this.userPrompt.length > 2000) {
								new Notice("Text too long");
								return;
							} else {
								if (this.settings.openAiApiKey == "") {
									new Notice("No API key provided");
									return;
								}

								const openai = new OpenAI({
									apiKey: this.settings.openAiApiKey,
									dangerouslyAllowBrowser: true,
									timeout: 40 * 1000, // 40 seconds (default is 10 minutes)
								});

								const response =
									await openai.chat.completions.create({
										messages: [
											{
												role: "system",
												content:
													this.settings.systemPrompt,
											},
											{
												role: "user",
												content: this.userPrompt,
											},
										],
										model: "gpt-3.5-turbo",
										temperature: 0,
										max_tokens: 1024,
									});

								this.response =
									response.choices[0].message.content
										?.split("\n")
										.slice(1, -1)
										.join("\n") ?? "";

								this.response = formatList(this.response);

								editor.setCursor(
									editor.lastLine(),
									editor.getLine(editor.lastLine()).length
								);

								editor.replaceRange(
									this.response,
									editor.getCursor()
								);
							}
						});
				});
			})
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function getSelectedText(): string {
	var selectedText = "";

	// window.getSelection
	if (window.getSelection) {
		selectedText = window.getSelection()?.toString() ?? "";
	}
	// document.getSelection
	else if (document.getSelection) {
		selectedText = document.getSelection()?.toString() ?? "";
	} else return "";

	return selectedText;
}

function formatList(inputString: string): string {
	const items = inputString
		.split(/\d+\.\s*/)
		.filter((item) => item.trim() !== "");

	const formattedList = items
		.map((item) => `- [ ] ${item.trim()}`)
		.join("\n");
	return formattedList;
}
