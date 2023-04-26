import React, { FC, useCallback, useEffect, useMemo, useRef } from "react";

import * as prettier from "prettier";
import * as squigglePlugin from "@quri/prettier-plugin-squiggle";

import { defaultKeymap } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { setDiagnostics } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

import { SqError, SqProject } from "@quri/squiggle-lang";

import { squiggleLanguageSupport } from "../languageSupport/squiggle.js";

// From basic setup
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  lineNumbers,
} from "@codemirror/view";
import { lightThemeHighlightingStyle } from "../languageSupport/highlightingStyle.js";

interface CodeEditorProps {
  value: string; // TODO - should be `initialValue`, since we don't really support value updates
  onChange: (value: string) => void;
  onSubmit?: () => void;
  width?: number;
  height?: number;
  showGutter?: boolean;
  errors?: SqError[];
  project: SqProject;
}

const compTheme = new Compartment();
const compGutter = new Compartment();
const compUpdateListener = new Compartment();
const compSubmitListener = new Compartment();
const compFormatListener = new Compartment();

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  onSubmit,
  width,
  height,
  showGutter = false,
  errors = [],
  project,
}) => {
  const editor = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);
  const languageSupport = useMemo(
    () => squiggleLanguageSupport(project),
    [project]
  );

  const format = useCallback(async () => {
    if (!editorView.current) {
      return;
    }
    const view = editorView.current;
    const code = view.state.doc.toString();
    const { formatted, cursorOffset } = await prettier.formatWithCursor(code, {
      parser: "squiggle",
      plugins: [squigglePlugin],
      cursorOffset: editorView.current.state.selection.main.to,
    });
    onChange(formatted);
    view.dispatch({
      changes: {
        from: 0,
        to: editorView.current.state.doc.length,
        insert: formatted,
      },
      selection: {
        anchor: cursorOffset,
      },
    });
  }, [onChange]);

  const state = useMemo(
    () =>
      EditorState.create({
        doc: value,
        extensions: [
          highlightSpecialChars(),
          history(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(lightThemeHighlightingStyle, { fallback: true }),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          highlightSelectionMatches({
            wholeWords: true,
            highlightWordAroundCursor: false, // Works weird on fractions! 5.3e10K
          }),
          compSubmitListener.of([]),
          compFormatListener.of([]),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
            indentWithTab,
          ]),
          compGutter.of([]),
          compUpdateListener.of([]),
          compTheme.of([]),
          languageSupport,
        ],
      }),
    [languageSupport]
  );

  useEffect(() => {
    if (editor.current) {
      const view = new EditorView({ state, parent: editor.current });
      editorView.current = view;

      return () => {
        view.destroy();
      };
    }
  }, [state]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compGutter.reconfigure(
        showGutter
          ? [
              lineNumbers(),
              highlightActiveLine(),
              highlightActiveLineGutter(),
              foldGutter(),
            ]
          : []
      ),
    });
  }, [showGutter]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compUpdateListener.reconfigure(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ),
    });
  }, [onChange]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compTheme.reconfigure(
        EditorView.theme({
          "&": {
            ...(width === undefined ? {} : { width: `${width}px` }),
            ...(height === undefined ? {} : { height: `${height}px` }),
          },
          ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
          ".cm-content": { padding: 0 },
          ":-moz-focusring.cm-content": { outline: "none" },
        })
      ),
    });
  }, [width, height]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compSubmitListener.reconfigure(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onSubmit?.();
              return true;
            },
          },
        ])
      ),
    });
  }, [onSubmit]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compFormatListener.reconfigure(
        keymap.of([
          {
            key: "Alt-Shift-f",
            run: () => {
              format();
              return true;
            },
          },
        ])
      ),
    });
  }, [format]);

  useEffect(() => {
    const docLength = editorView.current
      ? editorView.current.state.doc.length
      : 0;

    editorView.current?.dispatch(
      setDiagnostics(
        editorView.current.state,
        errors
          .map((err) => {
            const location = err.location();
            if (!location) {
              return undefined;
            }
            return {
              location,
              err,
            };
          })
          .filter((err): err is NonNullable<typeof err> => {
            return Boolean(
              err && err.location && err.location.end.offset < docLength
            );
          })
          .map((err) => ({
            from: err.location.start.offset,
            to: err.location.end.offset,
            severity: "error",
            message: err.err.toString(),
          }))
      )
    );
  }, [errors]);

  return (
    <div style={{ minWidth: width, minHeight: height }} ref={editor}></div>
  );
};
