import { List, Form, ActionPanel, Action, showToast, Clipboard, closeMainWindow } from "@raycast/api";
import { useLocalStorage, showFailureToast } from "@raycast/utils";
import { useState } from "react";

type Snippet = {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
};

export default function Command() {
  const [mode, setMode] = useState<"form" | "list">("form");
  const { value: snippets, setValue: setSnippets } = useLocalStorage<Snippet[]>("text-edit-paste-snippets", []);
  const [snippetName, setSnippetName] = useState("");
  const [textValue, setTextValue] = useState("");
  const [searchText, setSearchText] = useState("");

  async function handleSubmit(values: { text: string }) {
    const { text } = values;
    setTextValue(text);

    if (text && text.trim() !== "") {
      try {
        await Clipboard.paste(text);
        await closeMainWindow();
        showToast({ title: "Text pasted", message: "Text has been pasted to active window" });
      } catch (error) {
        showFailureToast(error, { title: "Could not paste text to active window" });
      }
    } else {
      showToast({ title: "Warning", message: "No text to paste" });
    }
  }

  // Save snippet function
  function handleSaveSnippet() {
    if (textValue.trim() === "") {
      showToast({ title: "Error", message: "Cannot save empty text as snippet" });
      return;
    }

    if (snippetName.trim() === "") {
      showToast({ title: "Error", message: "Please enter a name for the snippet" });
      return;
    }

    const newSnippet: Snippet = {
      id: Date.now().toString(),
      name: snippetName,
      content: textValue,
      createdAt: new Date(),
    };

    setSnippets([...(snippets || []), newSnippet]);
    setSnippetName("");
    showToast({ title: "Snippet saved", message: `Saved "${snippetName}" as snippet` });
  }

  // Use snippet function
  function useSnippet(content: string) {
    setTextValue(content);
    showToast({ title: "Snippet loaded", message: "Snippet content loaded to text area" });
  }

  // Delete snippet function
  function deleteSnippet(id: string) {
    const updatedSnippets = (snippets || []).filter((snippet) => snippet.id !== id);
    setSnippets(updatedSnippets);
    showToast({ title: "Snippet deleted", message: "Snippet has been deleted" });
  }

  if (mode === "form") {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              onSubmit={handleSubmit}
              title="Paste Text"
              shortcut={{ key: "enter", modifiers: ["cmd"] }}
            />
            <Action.SubmitForm onSubmit={() => handleSaveSnippet()} title="Save Snippet" />
            <Action title="View Snippets" onAction={() => setMode("list")} />
          </ActionPanel>
        }
        navigationTitle="Text Edit & Paste"
        isLoading={false}
      >
        <Form.Description
          title="Edit your text here"
          text="Enter or edit the text you want to paste (Press Cmd+Enter to paste)"
        />
        <Form.TextArea
          id="text"
          title="Text"
          placeholder="Enter your text here..."
          value={textValue}
          onChange={setTextValue}
        />
        <Form.Separator />
        <Form.Description title="Save as Snippet" text="Save your text as a snippet for later use" />
        <Form.TextField
          id="snippetName"
          title="Snippet Name"
          placeholder="Enter a name for the snippet"
          value={snippetName}
          onChange={setSnippetName}
        />
      </Form>
    );
  } else {
    // Filter snippets based on search text
    const filteredSnippets = searchText
      ? (snippets || []).filter(
          (snippet) =>
            snippet.name.toLowerCase().includes(searchText.toLowerCase()) ||
            snippet.content.toLowerCase().includes(searchText.toLowerCase()),
        )
      : snippets || [];

    return (
      <List
        actions={
          <ActionPanel>
            <Action title="Create New" onAction={() => setMode("form")} />
          </ActionPanel>
        }
        onSearchTextChange={setSearchText}
      >
        {!filteredSnippets || filteredSnippets.length === 0 ? (
          <List.EmptyView
            icon="📋"
            title={searchText ? "No matching snippets" : "No snippets saved yet"}
            description={searchText ? "Try a different search term" : "Create your first snippet from the form view"}
          />
        ) : (
          filteredSnippets.map((snippet) => (
            <List.Item
              key={snippet.id}
              title={snippet.name}
              subtitle={snippet.content.substring(0, 50) + (snippet.content.length > 50 ? "..." : "")}
              actions={
                <ActionPanel>
                  <Action
                    title="Use This Snippet"
                    onAction={() => {
                      useSnippet(snippet.content);
                      setMode("form");
                    }}
                  />
                  <Action
                    title="Delete Snippet"
                    onAction={() => {
                      deleteSnippet(snippet.id);
                    }}
                    style={Action.Style.Destructive}
                  />
                </ActionPanel>
              }
            />
          ))
        )}
      </List>
    );
  }
}
