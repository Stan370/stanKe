// ── Stream Dispatcher ─────────────────────────────────────────────────────────
//
// The backend mixes two types of data in one ReadableStream:
//
//   Data Plane : raw LLM text tokens  → yield to caller as-is
//   Control Plane: \x00<TYPE>:{json}\n → parse and dispatch
//
// Control packet types:
//   \x00TOOL:{...}\n   — tool call in progress (forward to UI)
//   \x00ERROR:{...}\n  — backend error (surface to UI)
//   \x00LOG:{...}\n    — server log (drop silently)
//
// The dispatcher scans the running buffer with indexOf('\x00') instead of
// splitting on newlines, so control packets are always found even when they
// arrive fused with text tokens in the same TCP chunk.

const CTRL_MARKER = '\x00';
const CTRL_TOOL   = '\x00TOOL:';
const CTRL_ERR    = '\x00ERROR:';
// \x00LOG: is no longer emitted by the backend, but kept here for safety.
const CTRL_LOG    = '\x00LOG:';

export const streamChatResponse = async function* (
  history: { role: string; content: string }[],
  newMessage: string,
  context?: string
) {
  try {
    const messageWithContext = context
      ? `[RELEVANT CONTEXT FROM USER DOCUMENTS]\n${context}\n[END CONTEXT]\n\nUser query: ${newMessage}`
      : newMessage;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageWithContext, history }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      yield `Error: ${errData.error || response.statusText}`;
      return;
    }

    if (!response.body) {
      yield 'Error: No response body received from the server.';
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    // buf accumulates decoded text across reader.read() calls.
    // We slice from it as we identify text segments and control packets.
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        // Flush whatever clean text remains — but never yield a partial control packet.
        if (buf && !buf.startsWith(CTRL_MARKER)) {
          yield buf;
        }
        break;
      }

      buf += decoder.decode(value, { stream: true });

      // ── Dispatcher loop ───────────────────────────────────────────────────
      // Keep draining the buffer until we either empty it or hit an incomplete
      // control packet (no \n terminator yet — need more network data).
      while (buf.length > 0) {
        const ctrlIdx = buf.indexOf(CTRL_MARKER);

        if (ctrlIdx === -1) {
          // ✅ Pure text, no control marker anywhere — yield it all.
          yield buf;
          buf = '';
          break;
        }

        if (ctrlIdx > 0) {
          // ✅ Text before the control marker — yield it immediately.
          yield buf.slice(0, ctrlIdx);
          buf = buf.slice(ctrlIdx);
        }

        // buf now starts with \x00 — find the end of this control packet (\n).
        const nlIdx = buf.indexOf('\n');
        if (nlIdx === -1) {
          // Incomplete control packet — wait for the next reader.read().
          break;
        }

        // Extract and dispatch the complete control packet (without \n).
        const packet = buf.slice(0, nlIdx);
        buf = buf.slice(nlIdx + 1);

        if (packet.startsWith(CTRL_ERR)) {
          // Surface backend errors as a forwarded error token for the UI.
          try {
            const payload = JSON.parse(packet.slice(CTRL_ERR.length));
            yield `\x00ERROR:${JSON.stringify(payload)}\n`;
          } catch {
            yield `Error: ${packet.slice(CTRL_ERR.length)}`;
          }

        } else if (packet.startsWith(CTRL_TOOL)) {
          // Forward tool-call marker so the UI can show a live status chip.
          yield packet + '\n';

        } else if (packet.startsWith(CTRL_LOG)) {
          // Drop — LOG packets are server-side only.
          // console.debug('[log]', packet);

        } else {
          // Unknown control packet — drop defensively.
        }
      }
    }

  } catch (error) {
    console.error('Chat Service Error:', error);
    yield 'Sorry, I encountered an error communicating with the server. Please try again later.';
  }
};