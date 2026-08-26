import { useEffect, useRef, useState } from "react";
import { api, apiUrl, Attachment, Digest, Email, IncomingAttachment, Profile, Task } from "./api";
const c = { URGENT: "red", IMPORTANT: "gold", FYI: "green" } as const;
export default function App() {
  const publicPage = window.location.pathname.replace(/\/+$/, "") || "/";
  const editor = useRef<HTMLDivElement>(null);
  const linkSelection = useRef<{ start: number; end: number } | null>(null);
  const [p, setP] = useState<Profile>(),
    [e, setE] = useState<Email[]>([]),
    [d, setD] = useState<Digest>(),
    [o, setO] = useState<Task[]>([]),
    [x, setX] = useState<Task[]>([]),
    [s, setS] = useState<Email>(),
    [q, setQ] = useState(""),
    [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(10),
    [priorityFilter, setPriorityFilter] = useState<"ALL" | Email["priority"]>("ALL"),
    [openTaskPage, setOpenTaskPage] = useState(0),
    [closedTaskPage, setClosedTaskPage] = useState(0),
    [taskPageSize, setTaskPageSize] = useState(10),
    [tab, setTab] = useState("inbox"),
    [r, setR] = useState(""),
    [replyBusy, setReplyBusy] = useState(false),
    [summaryBusy, setSummaryBusy] = useState(false),
    [summaryVisible, setSummaryVisible] = useState(false),
    [taskBusy, setTaskBusy] = useState(false),
    [copied, setCopied] = useState(false),
    [attachments, setAttachments] = useState<Attachment[]>([]),
    [incomingAttachments, setIncomingAttachments] = useState<IncomingAttachment[]>([]),
    [incomingError, setIncomingError] = useState(""),
    [linkOpen, setLinkOpen] = useState(false),
    [linkText, setLinkText] = useState(""),
    [linkUrl, setLinkUrl] = useState(""),
    [gmailBusy, setGmailBusy] = useState(false),
    [gmailStatus, setGmailStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  const load = async () => {
    try {
      setBusy(true);
      const me = await api.me();
      setP(me);
      if (me.provider === "google") await api.sync();
      const [a, b, f, g] = await Promise.all([
        api.emails(),
        api.digest(),
        api.tasks(),
        api.closedTasks(),
      ]);
      setE(a);
      setD(b);
      setO(f);
      setX(g);
    } catch {
      setP(undefined);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!s) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLinkOpen(false);
        setS(undefined);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [s]);
  if (publicPage === "/privacy" || publicPage === "/terms")
    return <PublicPage page={publicPage === "/privacy" ? "privacy" : "terms"} />;
  if (!p) return <PublicPage page="home" />;
  if (false)
    return (
      <div className="login">
        <div>
          <b className="brand">
            ✦ MailMind <i>AI</i>
          </b>
          <h1>Your inbox, understood.</h1>
          <p>
            Bring Gmail into one focused workspace for priority sorting, AI
            summaries, action items, and thoughtful replies.
          </p>
          <ul className="public-features">
            <li>Organize inbox messages by urgency and importance.</li>
            <li>Generate summaries, reply drafts, and linked action items.</li>
            <li>Create Gmail drafts and send replies only when you choose.</li>
          </ul>
          <button
            onClick={() =>
              (location.href =
                `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`)
            }
          >
            <span className="google-mark">G</span> Continue with Google
          </button>
          <small>Secure Gmail access to read, draft, and send email. You can sign out anytime.</small>
          <p className="public-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></p>
        </div>
      </div>
    );
  const done = async (t: Task) => {
    await api.complete(t.id);
    setO((v) => v.filter((z) => z.id !== t.id));
    setX((v) => [{ ...t, completed: true }, ...v]);
  };
  const deleteClosed = async (t: Task) => {
    if (!window.confirm(`Delete the closed task “${t.title}”?`)) return;
    await api.deleteClosedTask(t.id);
    setX((current) => current.filter((item) => item.id !== t.id));
  };
  const deleteAllClosed = async () => {
    if (!x.length || !window.confirm("Delete all closed tasks permanently?")) return;
    await api.deleteAllClosedTasks();
    setX([]);
  };
  const openTaskSource = (task: Task) => {
    const source = e.find((email) => email.id === task.emailId);
    if (!source) return;
    setS(source);
    setR("");
    setSummaryVisible(false);
    api.body(source.id).then(({ body, html }) => setS((current) => current?.id === source.id ? { ...current, body, html } : current));
    api.incomingAttachments(source.id).then(setIncomingAttachments).catch(() => setIncomingError("Could not load incoming attachments."));
  };
  const generateTasks = async () => {
    try {
      setTaskBusy(true);
      setError("");
      setO(await api.generateTasks());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate tasks.");
    } finally {
      setTaskBusy(false);
    }
  };
  const dashboardEmails = tab === "today" ? e.filter((email) => isTodayInIst(email.receivedAt)) : e;
  const shown = dashboardEmails.filter((z) =>
    (priorityFilter === "ALL" || z.priority === priorityFilter) &&
    `${z.subject} ${z.sender} ${z.preview}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleEmails = shown.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const taskMatches = (task: Task) => `${task.title} ${task.emailSubject || ""}`.toLowerCase().includes(q.toLowerCase());
  const visibleOpenTasks = o.filter(taskMatches);
  const visibleClosedTasks = x.filter(taskMatches);
  const openTaskPageCount = Math.max(1, Math.ceil(visibleOpenTasks.length / taskPageSize));
  const closedTaskPageCount = Math.max(1, Math.ceil(visibleClosedTasks.length / taskPageSize));
  const currentOpenTaskPage = Math.min(openTaskPage, openTaskPageCount - 1);
  const currentClosedTaskPage = Math.min(closedTaskPage, closedTaskPageCount - 1);
  const pagedOpenTasks = visibleOpenTasks.slice(currentOpenTaskPage * taskPageSize, (currentOpenTaskPage + 1) * taskPageSize);
  const pagedClosedTasks = visibleClosedTasks.slice(currentClosedTaskPage * taskPageSize, (currentClosedTaskPage + 1) * taskPageSize);
  const format = (command: "bold" | "underline") => {
    editor.current?.focus();
    document.execCommand(command);
    setR(editor.current?.innerHTML || r);
  };
  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editor.current?.contains(selection.anchorNode)) return;
    const selected = selection.getRangeAt(0);
    const before = document.createRange();
    before.selectNodeContents(editor.current);
    before.setEnd(selected.startContainer, selected.startOffset);
    linkSelection.current = { start: before.toString().length, end: before.toString().length + selected.toString().length };
  };
  const openLink = () => {
    rememberSelection();
    setLinkText(window.getSelection()?.toString() || "");
    setLinkUrl("");
    setLinkOpen(true);
  };
  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url || !editor.current) return;
    const range = rangeAtTextOffsets(editor.current, linkSelection.current);
    const anchor = document.createElement("a");
    anchor.href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = linkText.trim() || url;
    range.deleteContents();
    range.insertNode(anchor);
    range.setStartAfter(anchor);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    setR(editor.current.innerHTML);
    setLinkOpen(false);
  };
  const downloadIncomingAttachment = async (file: IncomingAttachment) => {
    if (!s) return;
    try {
      const response = await fetch(apiUrl(`/api/emails/${s.id}/attachments/${encodeURIComponent(file.id)}`), { credentials: "include" });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail ? `Download failed: ${detail}` : `Download failed (HTTP ${response.status}).`);
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setIncomingError(reason instanceof Error ? reason.message : "Could not download this attachment.");
    }
  };
  return (
    <main>
      <aside>
        <b className="brand">
          MailMind <i>AI</i>
        </b>
        <nav>
          {[
            ["inbox", "Inbox"],
            ["today", "Today"],
            ["tasks", `Tasks (${o.length})`],
            ["search", "Search"],
          ].map(([id, l]) => (
            <button
              className={tab === id ? "on" : ""}
              onClick={() => { setTab(id); setPage(0); setOpenTaskPage(0); setClosedTaskPage(0); setPriorityFilter("ALL"); }}
              key={id}
            >
              {l}
            </button>
          ))}
        </nav>
        <div className="profile">
          <b>{p.initials}</b>
          <span>
            <strong>{p.displayName}</strong>
            <small>{p.email}</small>
            <button
              onClick={async () => {
                await api.logout();
                setP(undefined);
              }}
            >
              Sign out
            </button>
          </span>
        </div>
      </aside>
      <section>
        <header>
          <div>
            <small>MAILMIND AI</small>
            <h1>
              {greet()}, {p.displayName.split(" ")[0]}
            </h1>
            <p>{tab === "today" ? "Today's inbox, focused." : "Your inbox, already understood."}</p>
          </div>
          <button className="refresh" disabled={busy} onClick={load}>
            {busy ? "Syncing Gmail..." : "Refresh inbox"}
          </button>
        </header>
        <div className="cards">
          <Card c="red" n={tab === "today" ? dashboardEmails.filter((email) => email.priority === "URGENT").length : d?.urgent ?? 0} t="Urgent" active={priorityFilter === "URGENT"} onClick={() => { setPriorityFilter(priorityFilter === "URGENT" ? "ALL" : "URGENT"); setPage(0); }} />
          <Card c="gold" n={tab === "today" ? dashboardEmails.filter((email) => email.priority === "IMPORTANT").length : d?.important ?? 0} t="Important" active={priorityFilter === "IMPORTANT"} onClick={() => { setPriorityFilter(priorityFilter === "IMPORTANT" ? "ALL" : "IMPORTANT"); setPage(0); }} />
          <Card c="green" n={tab === "today" ? dashboardEmails.filter((email) => email.priority === "FYI").length : d?.fyi ?? 0} t="FYI" active={priorityFilter === "FYI"} onClick={() => { setPriorityFilter(priorityFilter === "FYI" ? "ALL" : "FYI"); setPage(0); }} />
          <div className="brief">
            <b>Daily brief</b>
            <p>{tab === "today" ? dashboardEmails.find((email) => email.priority !== "FYI")?.summary || "Nothing urgent has surfaced today." : d?.highlights[0] || "Nothing urgent has surfaced yet."}</p>
          </div>
        </div>
        <div className="panes">
          <div className="panel">
            <div className="bar">
              <h3>{tab === "tasks" ? "Open tasks" : tab === "today" ? "Today's inbox" : "Priority inbox"}</h3>
              {tab === "tasks" && (
                <button className="task-action" disabled={taskBusy} onClick={generateTasks}>
                  {taskBusy ? "Generating AI tasks..." : "Generate AI tasks"}
                </button>
              )}
              <input
                placeholder="Search"
                value={q}
                onChange={(v) => { setQ(v.target.value); setPage(0); setOpenTaskPage(0); setClosedTaskPage(0); }}
              />
            </div>
            {tab === "tasks" ? (
              <>
                <Tasks t={pagedOpenTasks} done={done} source={openTaskSource} />
                <Pagination page={currentOpenTaskPage} pages={openTaskPageCount} total={visibleOpenTasks.length} size={taskPageSize} onPage={setOpenTaskPage} onSize={(size) => { setTaskPageSize(size); setOpenTaskPage(0); setClosedTaskPage(0); }} />
                <div className="closed-panel">
                  <div className="closed-header"><h3>Closed tasks</h3><button className="delete-all" disabled={!x.length} onClick={deleteAllClosed}>Delete all closed tasks</button></div>
                  <Closed t={pagedClosedTasks} remove={deleteClosed} source={openTaskSource} />
                  <Pagination page={currentClosedTaskPage} pages={closedTaskPageCount} total={visibleClosedTasks.length} size={taskPageSize} onPage={setClosedTaskPage} onSize={(size) => { setTaskPageSize(size); setOpenTaskPage(0); setClosedTaskPage(0); }} />
                </div>
                {error && <p className="reply-error">{error}</p>}
              </>
            ) : (
              <>
              {visibleEmails.map((z) => (
                <article
                  className="email"
                  onClick={() => {
                    setS(z);
                    setR("");
                    setAttachments([]);
                    setSummaryVisible(false);
                    setIncomingAttachments([]);
                    setIncomingError("");
                    setGmailStatus("");
                    api.body(z.id).then(({ body, html }) => setS((current) => current?.id === z.id ? { ...current, body, html } : current));
                    api.incomingAttachments(z.id).then(setIncomingAttachments).catch(() => setIncomingError("Could not load incoming attachments."));
                  }}
                  key={z.id}
                >
                  <i className={c[z.priority]} />
                  <div>
                    <b>{z.sender}</b>
                    <strong>{z.subject}</strong>
                    <p>{z.preview}</p>
                  </div>
                  <small>{formatEmailDate(z.receivedAt)}</small>
                </article>
              ))}
              <Pagination page={currentPage} pages={pageCount} total={shown.length} size={pageSize} onPage={setPage} onSize={(size) => { setPageSize(size); setPage(0); }} />
              </>
            )}
          </div>
          <div className="panel side">
            <h3>Open tasks</h3>
            <Tasks t={o} done={done} source={openTaskSource} />
          </div>
        </div>
      </section>
      {s && (
        <div className="drawer">
          <button className="close" onClick={() => setS(undefined)}>
            x
          </button>
          <h2>{s.subject}</h2>
          <div className="original">
            {s.html ? <><div className="gmail-message-header"><span className="sender-avatar">{s.sender.trim().charAt(0).toUpperCase()}</span><div><strong>{s.sender}</strong><small>to me · {formatEmailDate(s.receivedAt)}</small></div></div><iframe className="email-html" title="Original email" sandbox="allow-popups" referrerPolicy="no-referrer" srcDoc={s.html} /></> : <><b>Original email preview</b><p><LinkifiedText text={readableEmailPreview(s.body || s.preview)} /></p></>}
            {incomingAttachments.length > 0 && <div className="incoming-files"><b>Attachments</b>{incomingAttachments.map((file) => <div className="incoming-file" key={file.id}><span>{file.name} <small>{formatFileSize(file.size)}</small></span><button onClick={() => downloadIncomingAttachment(file)}>Download</button></div>)}</div>}
            {incomingError && <p className="incoming-error">{incomingError}</p>}
          </div>
          <div className="summary">
            <b>AI summary</b>
            {summaryVisible && <p>{s.summary}</p>}
            <button
              className={"summary-button" + (summaryBusy ? " is-generating" : "")}
              disabled={summaryBusy}
              onClick={async () => {
                try {
                  setSummaryBusy(true);
                  const n = await api.summary(s.id);
                  setS((current) => current?.id === n.id ? { ...n, body: current.body, html: current.html } : n);
                  setE((v) => v.map((z) => (z.id === n.id ? n : z)));
                  setSummaryVisible(true);
                } finally {
                  setSummaryBusy(false);
                }
              }}
            >
              {summaryBusy ? "Generating AI summary..." : "Generate AI summary"}
            </button>
            {summaryBusy && <p className="generation-status" aria-live="polite">MailMind is reading the email and creating a summary.</p>}
          </div>
          <button
            className="primary"
            disabled={replyBusy}
            onClick={async () => {
              try {
                setReplyBusy(true);
                setCopied(false);
                setR(toEditorHtml(normalizeReply((await api.reply(s.id, "Write an appropriate concise polite reply based on this email.")).text, p.displayName)));
              } finally {
                setReplyBusy(false);
              }
            }}
          >
            {replyBusy ? "Generating AI reply..." : "Generate AI reply"}
          </button>
          {r && (
            <>
              <div className="composer">
                <div className="compose-row"><span>To</span><b>{s.sender}</b></div>
                <div className="compose-row"><span>Subject</span><b>Re: {s.subject}</b></div>
                <div className="editor-toolbar" aria-label="Text formatting">
                  <button title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")}><strong>B</strong></button>
                  <button title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")}><u>U</u></button>
                  <button className="link-tool" title="Insert link" onMouseDown={(event) => event.preventDefault()} onClick={openLink}>{"\u{1F517}"}</button>
                </div>
                <div
                  className="rich-editor"
                  ref={editor}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: r }}
                  onInput={(event) => {
                    setCopied(false);
                    setR(event.currentTarget.innerHTML);
                  }}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onKeyDown={(event) => {
                    if (!(event.ctrlKey || event.metaKey)) return;
                    const key = event.key.toLowerCase();
                    if (key === "b" || key === "u") {
                      event.preventDefault();
                      format(key === "b" ? "bold" : "underline");
                    }
                    if (key === "k") {
                      event.preventDefault();
                      openLink();
                    }
                    if (key === "z" || key === "y") {
                      event.preventDefault();
                      document.execCommand(key === "y" || event.shiftKey ? "redo" : "undo");
                      setR(editor.current?.innerHTML || r);
                    }
                  }}
                />
                {linkOpen && <div className="link-popover" role="dialog" aria-label="Insert link">
                  <input autoFocus placeholder="Text" value={linkText} onChange={(event) => setLinkText(event.target.value)} />
                  <div><span>{"\u{1F517}"}</span><input placeholder="Type or paste a link" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") insertLink(); }} /><button disabled={!linkUrl.trim()} onClick={insertLink}>Apply</button></div>
                </div>}
                <div className="attachment-bar">
                  <label className="attach-button" htmlFor="compose-files">Attach files</label>
                  <input id="compose-files" type="file" multiple onChange={async (event) => {
                    try {
                      const uploaded = await filesToAttachments(Array.from(event.target.files || []));
                      setAttachments((current) => [...current, ...uploaded]);
                      setGmailStatus("");
                    } catch (reason) {
                      setGmailStatus(reason instanceof Error ? reason.message : "Could not attach those files.");
                    } finally {
                      event.target.value = "";
                    }
                  }} />
                  {attachments.map((file, index) => <span className={"attachment" + (file.invalid ? " invalid" : "")} key={file.name + index}><span className="attachment-name">{file.name}</span>{file.invalid && <small>Too large (max 10 MB)</small>}<button className="attachment-remove" title="Remove attachment" onClick={() => setAttachments((current) => current.filter((_, item) => item !== index))}>Remove</button></span>)}
                </div>
              </div>
              <button
                className={"copy" + (copied ? " copied" : "")}
                onClick={async () => {
                  await navigator.clipboard.writeText(toPlainText(r));
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy reply"}
              </button>
              <div className="gmail-actions">
                <button
                  className="gmail-draft"
                  disabled={gmailBusy || attachments.some((file) => file.invalid)}
                  onClick={async () => {
                    try {
                      setGmailBusy(true);
                      setGmailStatus("Saving draft to Gmail...");
                      await api.saveDraft(s.id, r, attachments);
                      setGmailStatus("Draft saved in Gmail.");
                    } catch (reason) {
                      setGmailStatus(reason instanceof Error ? reason.message : "Could not save the Gmail draft.");
                    } finally {
                      setGmailBusy(false);
                    }
                  }}
                >
                  {gmailBusy ? "Working with Gmail..." : "Save as Gmail draft"}
                </button>
                <button
                  className="gmail-send"
                  disabled={gmailBusy || attachments.some((file) => file.invalid)}
                  onClick={async () => {
                    if (!window.confirm("Send this reply through your Gmail account now?")) return;
                    try {
                      setGmailBusy(true);
                      setGmailStatus("Sending email through Gmail...");
                      await api.send(s.id, r, attachments);
                      setGmailStatus("Email sent through Gmail.");
                    } catch (reason) {
                      setGmailStatus(reason instanceof Error ? reason.message : "Could not send the Gmail email.");
                    } finally {
                      setGmailBusy(false);
                    }
                  }}
                >
                  Send email
                </button>
              </div>
              {gmailStatus && <p className="gmail-status" aria-live="polite">{gmailStatus}</p>}
            </>
          )}
        </div>
      )}
    </main>
  );
}
function normalizeReply(text: string, name: string) {
  const closing = /(Best regards,?|Kind regards,?|Regards,?)/i;
  let value = text.replace(/\s*(Best regards,?|Kind regards,?|Regards,?)\s*/i, "\n\n$1\n").trim();
  if (!closing.test(value)) value += `\n\nBest regards,\n${name}`;
  else if (!value.endsWith(name)) value += `\n${name}`;
  return value;
}
function toEditorHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}
function readableEmailPreview(text: string) {
  let clean = text
    .replace(/&(amp;)?#(?:x[0-9a-f]+|[0-9]+);/gi, "")
    .replace(/\s*\(\[https?:\/\/[^)]*\]\(https?:\/\/[^)]*\)\)\s*/gi, " ")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/[â€“â€”]/g, "-");
  const lower = clean.toLowerCase();
  for (const marker of ["at unstop", "if you'd prefer not to receive", "privacy policy", "terms and conditions"]) {
    const index = lower.indexOf(marker);
    if (index > 350) {
      clean = clean.slice(0, index);
      break;
    }
  }
  const formatted = clean
    .replace(/(On\s.+?\swrote:)\s*/i, "\n\n$1\n")
    .replace(/\s*>\s*/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  let previousBlank = false;
  return formatted
    .split("\n")
    .map((line) => line.replace(/[\u00a0\u2000-\u200b\ufeff]/g, " ").trim())
    .filter((line) => {
      if (line) {
        previousBlank = false;
        return true;
      }
      if (previousBlank) return false;
      previousBlank = true;
      return true;
    })
    .join("\n")
    .trim();
}
function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function LinkifiedText({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s<]+)/g).map((part, index) => {
    const markdown = part.match(/^\[([^\]]+)]\((https?:\/\/[^)\s]+)\)$/i);
    if (markdown) return <a href={markdown[2]} target="_blank" rel="noreferrer" key={index}>{markdown[1]}</a>;
    if (/^https?:\/\//i.test(part)) { const url = part.replace(/[.,;:!?]+$/, ""); return <a href={url} target="_blank" rel="noreferrer" key={index}>{url}</a>; }
    return part;
  })}</>;
}
function toPlainText(html: string) {
  return new DOMParser().parseFromString(html, "text/html").body.innerText;
}
async function filesToAttachments(files: File[]): Promise<Attachment[]> {
  return Promise.all(files.map(async (file) => {
    if (file.size > 10 * 1024 * 1024) return { name: file.name, contentType: file.type || "application/octet-stream", data: "", invalid: true, error: "Too large" };
    const value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
    return { name: file.name, contentType: file.type || "application/octet-stream", data: value };
  }));
}
function rangeAtTextOffsets(root: HTMLElement, saved: { start: number; end: number } | null) {
  const range = document.createRange();
  if (!saved) {
    range.selectNodeContents(root);
    range.collapse(false);
    return range;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let offset = 0;
  let startSet = false;
  while ((node = walker.nextNode())) {
    const length = node.textContent?.length || 0;
    if (!startSet && saved.start <= offset + length) {
      range.setStart(node, Math.max(0, saved.start - offset));
      startSet = true;
    }
    if (startSet && saved.end <= offset + length) {
      range.setEnd(node, Math.max(0, saved.end - offset));
      return range;
    }
    offset += length;
  }
  range.selectNodeContents(root);
  range.collapse(false);
  return range;
}
function PublicPage({ page }: { page: "home" | "privacy" | "terms" }) {
  const login = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`;
  };
  const content = page === "privacy" ? <>
    <h1>Privacy Policy</h1>
    <p>Last updated: 27 August 2026</p>
    <h2>What MailMind AI accesses</h2><p>When you choose to connect Google, MailMind AI accesses your basic Google profile and Gmail messages needed to display your inbox, create summaries and reply drafts, identify action items, and create drafts or send replies only when you direct it to do so.</p>
    <h2>How information is used</h2><p>MailMind AI uses your email content solely to provide the features you request. When you generate a summary, reply, or task list, relevant email content is sent to the configured AI provider to produce that result.</p>
    <h2>Storage and sharing</h2><p>MailMind AI stores account details and synced email data needed to operate the service. We do not sell Google user data. We do not use Google user data for advertising. We share it only with service providers necessary to run MailMind AI, including the AI provider when you request an AI feature.</p>
    <h2>Your choices</h2><p>You can sign out at any time. You can stop using the service and request deletion of your stored MailMind AI account data by contacting the support email shown on the Google consent screen.</p>
  </> : <>
    <h1>Terms of Service</h1>
    <p>Last updated: 27 August 2026</p>
    <h2>Using MailMind AI</h2><p>MailMind AI helps you organize Gmail, generate summaries and drafts, and manage action items. You remain responsible for reviewing every generated result and for every email that is drafted or sent from your Gmail account.</p>
    <h2>Your account</h2><p>Use MailMind AI only with Google accounts that you are authorized to access. Keep your account secure and promptly sign out on shared devices.</p>
    <h2>Service availability</h2><p>MailMind AI is provided as available. AI-generated content can be inaccurate or incomplete, so it should not be treated as legal, financial, medical, or professional advice.</p>
    <h2>Contact</h2><p>For questions about these terms, contact the support email listed on the MailMind AI Google consent screen.</p>
  </>;
  if (page !== "home") return <div className="legal-page"><PublicNav onLogin={login} /> <article className="legal-content">{content}</article></div>;
  return <div className="public-page"><PublicNav onLogin={login} /><section className="public-hero"><div><p className="eyebrow">MAILMIND AI</p><h1>Your Gmail, thoughtfully organized.</h1><p className="lead">MailMind AI brings priority inbox management, AI summaries, useful action items, and reviewable Gmail replies into one focused workspace.</p><button className="public-login" onClick={login}><span className="google-mark">G</span> Continue with Google</button><p className="assurance">You choose what MailMind can do. Review AI output before sending any email.</p></div><div className="public-card"><b>Built for focus</b><span>Prioritize important messages</span><span>Generate concise email summaries</span><span>Turn emails into linked tasks</span><span>Draft, edit, and send replies through Gmail</span></div></section><section className="public-disclosure"><h2>How MailMind uses Google data</h2><p>MailMind accesses Gmail messages only to provide the inbox, AI summary, task, draft, and send features you request. It does not sell Google user data or use it for advertising. Read our <a href="/privacy">Privacy Policy</a> for details.</p></section><PublicFooter /></div>;
}
function PublicNav({ onLogin }: { onLogin: () => void }) { return <header className="public-nav"><a className="public-brand" href="/">MailMind <i>AI</i></a><nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button onClick={onLogin}>Sign in with Google</button></nav></header>; }
function PublicFooter() { return <footer className="public-footer"><span>© 2026 MailMind AI</span><span><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></span></footer>; }
function greet() {
  const h = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(),
  );
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function isTodayInIst(value: string) {
  const format = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  return format.format(new Date(value)) === format.format(new Date());
}
function formatEmailDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
function Card({ c, n, t, active, onClick }: { c: string; n: number; t: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={"card " + c + (active ? " selected" : "")} onClick={onClick} aria-pressed={active} title={`Show ${t.toLowerCase()} emails`}>
      <b>{n}</b>
      <span>{t}</span>
    </button>
  );
}
function Pagination({ page, pages, total, size, onPage, onSize }: { page: number; pages: number; total: number; size: number; onPage: (page: number) => void; onSize: (size: number) => void }) {
  if (!total) return null;
  return <div className="pagination"><label>Show <select value={size} onChange={(event) => onSize(Number(event.target.value))}>{[10, 15, 25, 50].map((value) => <option value={value} key={value}>{value}</option>)}</select> per page</label><button disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button></div>;
}
function Tasks({ t, done, source }: { t: Task[]; done: (x: Task) => void; source: (x: Task) => void }) {
  return (
    <>
      {t.map((x) => (
        <div className="task" key={x.id}>
          <input id={x.id} type="checkbox" onChange={() => done(x)} />
          <span className="task-detail"><label htmlFor={x.id}>{x.title.replace(/<[^>]*>/g, " ")}</label>{x.emailId && <button className="task-source" onClick={() => source(x)}>Open source email{x.emailSubject ? `: ${x.emailSubject}` : ""}</button>}</span>
        </div>
      ))}
    </>
  );
}
function Closed({ t, remove, source }: { t: Task[]; remove: (x: Task) => void; source: (x: Task) => void }) {
  return (
    <>
      {t.map((x) => (
        <div className="task closed" key={x.id}>
          <span className="task-detail"><span>{x.title.replace(/<[^>]*>/g, " ")}</span>{x.emailId && <button className="task-source" onClick={() => source(x)}>Open source email{x.emailSubject ? `: ${x.emailSubject}` : ""}</button>}</span>
          <button className="delete-task" onClick={() => remove(x)}>Delete</button>
        </div>
      ))}
    </>
  );
}
