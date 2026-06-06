import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authContext } from "../../context/authContext";
import { getConversations } from "../../api/gigs";
import { useAccessToken } from "../../hooks/useAccessToken";

/** Legacy /gighub/messages URLs → floating chat only (no full-page inbox). */
const ChatMessagesRedirect = () => {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openChatWithConversation, openChatWithParticipantEmail, openChatInbox } =
    useContext(authContext);

  useEffect(() => {
    if (!accessToken) {
      navigate("/signin", { replace: true });
      return;
    }

    const withEmail = searchParams.get("with");
    const convId = searchParams.get("conversation");

    const finish = () => navigate("/gighub/dashboard", { replace: true });

    if (withEmail) {
      openChatWithParticipantEmail(withEmail);
      finish();
      return;
    }

    if (convId) {
      (async () => {
        try {
          const res = await getConversations(accessToken);
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          const found = list.find((c) => String(c.id) === String(convId));
          if (found) openChatWithConversation(found);
          else openChatInbox();
        } catch {
          openChatInbox();
        }
        finish();
      })();
      return;
    }

    openChatInbox();
    finish();
  }, []);

  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-[#0a0a0f] text-white/40 text-sm">
      Opening messages…
    </div>
  );
};

export default ChatMessagesRedirect;
