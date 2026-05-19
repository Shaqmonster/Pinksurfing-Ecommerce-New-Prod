import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authContext } from "../../context/authContext";
import { getConversations } from "../../api/gigs";

/** Legacy /gighub/messages URLs → floating chat only (no full-page inbox). */
const ChatMessagesRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cookies] = useCookies(["access_token"]);
  const { openChatWithConversation, openChatWithParticipantEmail, openChatInbox } =
    useContext(authContext);

  useEffect(() => {
    if (!cookies.access_token) {
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
          const res = await getConversations(cookies.access_token);
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
