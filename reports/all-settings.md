# All Experimental Settings

*Generated: 2026-01-22*

Total settings: 132

## Settings by Area

| Setting | Default | Tags |
|---------|---------|------|
| **chat.agent** | | |
| `chat.agent.thinking.collapsedTools` | `'always'` | experimental |
| **chat.allowAnonymousAccess** | | |
| `chat.allowAnonymousAccess` | `false` | experimental |
| **chat.extensionUnification** | | |
| `chat.extensionUnification.enabled` | `true` | experimental |
| **chat.sendElementsToChat** | | |
| `chat.sendElementsToChat.attachCSS` | `true` | preview |
| `chat.sendElementsToChat.attachImages` | `true` | experimental |
| `chat.sendElementsToChat.enabled` | `true` | preview |
| **editor.experimental** | | |
| `editor.experimental.asyncTokenization` | `true` | experimental |
| `editor.experimental.asyncTokenizationVerification` | `false` | experimental |
| `editor.experimental.preferTreeSitter.css` | `false` | experimental |
| `editor.experimental.preferTreeSitter.ini` | `false` | experimental |
| `editor.experimental.preferTreeSitter.regex` | `false` | experimental |
| `editor.experimental.preferTreeSitter.typescript` | `false` | experimental |
| `editor.experimental.treeSitterTelemetry` | `false` | experimental |
| **editor.inlineSuggest** | | |
| `editor.inlineSuggest.edits.showLongDistanceHint` | `defaults.edits.showLongDistanceHint` | nextEditSuggestions, experimental |
| `editor.inlineSuggest.experimental.emptyResponseInformation` | `defaults.experimental.emptyResponseInformation` | experimental |
| `editor.inlineSuggest.experimental.showOnSuggestConflict` | `defaults.experimental.showOnSuggestConflict` | experimental |
| `editor.inlineSuggest.experimental.suppressInlineSuggestions` | `defaults.experimental.suppressInlineSuggestions` | experimental |
| `editor.inlineSuggest.triggerCommandOnProviderChange` | `defaults.triggerCommandOnProviderChange` | experimental |
| **git.optimisticUpdate** | | |
| `git.optimisticUpdate` | `true` | experimental |
| **github.copilot** | | |
| `github.copilot.chat.agent.omitFileAttachmentContents` | `false` | advanced, experimental |
| `github.copilot.chat.agent.temperature` | *(null)* | advanced, experimental |
| `github.copilot.chat.agentHistorySummarizationForceGpt41` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.agentHistorySummarizationMode` | *(null)* | advanced, experimental |
| `github.copilot.chat.agentHistorySummarizationWithPromptCache` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.alternateGeminiModelFPrompt.enabled` | `false` | experimental, onExp |
| `github.copilot.chat.alternateGptPrompt.enabled` | `false` | experimental |
| `github.copilot.chat.anthropic.contextEditing.config` | `null` | advanced, experimental |
| `github.copilot.chat.anthropic.contextEditing.enabled` | `true` | experimental, onExp |
| `github.copilot.chat.anthropic.thinking.budgetTokens` | `4000` | experimental, onExp |
| `github.copilot.chat.anthropic.tools.websearch.allowedDomains` | `[]` | experimental |
| `github.copilot.chat.anthropic.tools.websearch.blockedDomains` | `[]` | experimental |
| `github.copilot.chat.anthropic.tools.websearch.enabled` | `false` | experimental, onExp |
| `github.copilot.chat.anthropic.tools.websearch.maxUses` | `5` | experimental |
| `github.copilot.chat.anthropic.tools.websearch.userLocation` | `null` | experimental |
| `github.copilot.chat.anthropic.toolSearchTool.enabled` | `false` | experimental, onExp |
| `github.copilot.chat.anthropic.useMessagesApi` | `true` | experimental, onExp |
| `github.copilot.chat.askQuestions.enabled` | `true` | experimental, onExp |
| `github.copilot.chat.claudeCode.debug` | `false` | advanced, experimental |
| `github.copilot.chat.claudeCode.enabled` | `false` | advanced, experimental |
| `github.copilot.chat.cli.customAgents.enabled` | `true` | advanced, experimental |
| `github.copilot.chat.cli.mcp.enabled` | `false` | advanced, experimental |
| `github.copilot.chat.codeGeneration.instructions` | `[]` | experimental |
| `github.copilot.chat.codesearch.agent.enabled` | `true` | advanced, experimental |
| `github.copilot.chat.codesearch.enabled` | `false` | preview |
| `github.copilot.chat.commitMessageGeneration.instructions` | `[]` | experimental |
| `github.copilot.chat.completionsFetcher` | *(null)* | experimental, onExp |
| `github.copilot.chat.copilotDebugCommand.enabled` | `true` | preview |
| `github.copilot.chat.customAgents.showOrganizationAndEnterpriseAgents` | `false` | experimental |
| `github.copilot.chat.debug.overrideChatEngine` | *(null)* | advanced, experimental |
| `github.copilot.chat.debug.requestLogger.maxEntries` | `100` | advanced, experimental |
| `github.copilot.chat.debugTerminalCommandPatterns` | `[]` | advanced, experimental |
| `github.copilot.chat.editRecording.enabled` | `false` | advanced, experimental |
| `github.copilot.chat.edits.gemini3MultiReplaceString` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.edits.suggestRelatedFilesForTests` | `true` | experimental |
| `github.copilot.chat.edits.suggestRelatedFilesFromGitHistory` | `true` | experimental |
| `github.copilot.chat.enableUserPreferences` | `false` | advanced, experimental |
| `github.copilot.chat.feedback.onChange` | `false` | advanced, experimental |
| `github.copilot.chat.generateTests.codeLens` | `false` | experimental |
| `github.copilot.chat.githubMcpServer.enabled` | `false` | experimental |
| `github.copilot.chat.githubMcpServer.lockdown` | `false` | experimental |
| `github.copilot.chat.githubMcpServer.readonly` | `false` | experimental |
| `github.copilot.chat.githubMcpServer.toolsets` | `["default"]` | experimental |
| `github.copilot.chat.gpt5AlternativePatch` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.imageUpload.enabled` | `true` | experimental, onExp |
| `github.copilot.chat.inlineChat.selectionRatioThreshold` | `0` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.chatSessionContextProvider.enabled` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.diagnosticsContextProvider.enabled` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.nextCursorPrediction.currentFileMaxTokens` | `2000` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.nextCursorPrediction.displayLine` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.renameSymbolSuggestions` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.inlineEdits.triggerOnEditorChangeAfterSeconds` | *(null)* | advanced, experimental, onExp |
| `github.copilot.chat.instantApply.shortContextLimit` | `8000` | advanced, experimental, onExp |
| `github.copilot.chat.instantApply.shortContextModelName` | `"gpt-4o-instant-apply-full-ft-v66-short"` | advanced, experimental, onExp |
| `github.copilot.chat.languageContext.fix.typescript.enabled` | `false` | experimental, onExP |
| `github.copilot.chat.languageContext.inline.typescript.enabled` | `false` | experimental, onExP |
| `github.copilot.chat.languageContext.typescript.cacheTimeout` | `500` | experimental, onExP |
| `github.copilot.chat.languageContext.typescript.enabled` | `false` | experimental, onExP |
| `github.copilot.chat.languageContext.typescript.includeDocumentation` | `false` | experimental, onExP |
| `github.copilot.chat.languageContext.typescript.items` | `"double"` | experimental, onExP |
| `github.copilot.chat.localWorkspaceRecording.enabled` | `false` | advanced, experimental |
| `github.copilot.chat.nesFetcher` | *(null)* | experimental, onExp |
| `github.copilot.chat.newWorkspace.useContext7` | `false` | experimental |
| `github.copilot.chat.newWorkspaceCreation.enabled` | `true` | experimental |
| `github.copilot.chat.notebook.alternativeFormat` | `"xml"` | advanced, experimental, onExp |
| `github.copilot.chat.notebook.alternativeNESFormat.enabled` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.notebook.enhancedNextEditSuggestions.enabled` | `false` | experimental, onExp |
| `github.copilot.chat.notebook.followCellExecution.enabled` | `false` | experimental |
| `github.copilot.chat.notebook.summaryExperimentEnabled` | `false` | advanced, experimental |
| `github.copilot.chat.notebook.variableFilteringEnabled` | `false` | advanced, experimental |
| `github.copilot.chat.omitBaseAgentInstructions` | `false` | advanced, experimental |
| `github.copilot.chat.projectLabels.chat` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.projectLabels.expanded` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.projectLabels.inline` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.promptFileContextProvider.enabled` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.pullRequestDescriptionGeneration.instructions` | `[]` | experimental |
| `github.copilot.chat.responsesApiReasoningEffort` | `"default"` | experimental, onExp |
| `github.copilot.chat.responsesApiReasoningSummary` | `"detailed"` | experimental, onExp |
| `github.copilot.chat.review.intent` | `false` | advanced, experimental |
| `github.copilot.chat.reviewAgent.enabled` | `true` | preview |
| `github.copilot.chat.reviewSelection.enabled` | `true` | preview |
| `github.copilot.chat.reviewSelection.instructions` | `[]` | preview |
| `github.copilot.chat.searchSubagent.enabled` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.setupTests.enabled` | `true` | experimental |
| `github.copilot.chat.suggestRelatedFilesFromGitHistory.useEmbeddings` | `false` | advanced, experimental |
| `github.copilot.chat.summarizeAgentConversationHistory.enabled` | `true` | experimental |
| `github.copilot.chat.summarizeAgentConversationHistoryThreshold` | *(null)* | advanced, experimental |
| `github.copilot.chat.testGeneration.instructions` | `[]` | experimental |
| `github.copilot.chat.tools.defaultToolsGrouped` | `false` | advanced, experimental, onExp |
| `github.copilot.chat.tools.memory.enabled` | `false` | experimental, onExp |
| `github.copilot.chat.useResponsesApi` | `true` | experimental, onExp |
| `github.copilot.chat.useResponsesApiTruncation` | `false` | advanced, experimental |
| `github.copilot.chat.virtualTools.threshold` | `128` | experimental |
| `github.copilot.chat.workspace.enableCodeSearch` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.workspace.enableEmbeddingsSearch` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.workspace.enableFullWorkspace` | `true` | advanced, experimental, onExp |
| `github.copilot.chat.workspace.maxLocalIndexSize` | `100000` | advanced, experimental, onExp |
| `github.copilot.chat.workspace.preferredEmbeddingsModel` | `""` | advanced, experimental, onExp |
| `github.copilot.chat.workspace.prototypeAdoCodeSearchEndpointOverride` | `""` | advanced, experimental |
| `github.copilot.nextEditSuggestions.preferredModel` | `"none"` | advanced, experimental, onExp |
| **http.experimental** | | |
| `http.experimental.networkInterfaceCheckInterval` | `300` | experimental |
| `http.experimental.systemCertificatesV2` | `false` | experimental |
| **http.systemCertificatesNode** | | |
| `http.systemCertificatesNode` | `systemCertificatesNodeDefault` | experimental |
| **ipynb.experimental** | | |
| `ipynb.experimental.serialization` | `true` | experimental |
| **mermaid-chat.enabled** | | |
| `mermaid-chat.enabled` | `false` | experimental |
| **properties** | | |
| `properties` | `'default'` | experimental |
| **scm.repositories** | | |
| `scm.repositories.explorer` | `false` | experimental |
| **search.searchView** | | |
| `search.searchView.keywordSuggestions` | `false` | preview |
| `search.searchView.semanticSearchBehavior` | `<computed>` | preview |
| **simpleBrowser.useIntegratedBrowser** | | |
| `simpleBrowser.useIntegratedBrowser` | `false` | experimental, onExP |
| **typescript.experimental** | | |
| `typescript.experimental.useTsgo` | `false` | experimental |
| **typescript.tsserver** | | |
| `typescript.tsserver.experimental.enableProjectDiagnostics` | `false` | experimental |
| **workbench.experimental** | | |
| `workbench.experimental.share.enabled` | `false` | experimental |
