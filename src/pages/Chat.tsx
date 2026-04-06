import { useState } from 'react';
import { Skeleton } from 'boneyard-js/react';
import Layout from '@/components/Layout';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Conversation } from '@/lib/chatService';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatPageSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isMobile = useIsMobile();

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  return (
    <Layout pageTitle="Chat">
      <div className="sm:p-6 h-[calc(100vh-65px)] flex">
        <Skeleton name="chat-page" loading={!loaded} fallback={<ChatPageSkeleton />}>
          {/* Conversation List */}
          <div className={`${isMobile ? (selectedConversation ? 'hidden' : 'w-full') : 'w-80 lg:w-96'} flex-shrink-0`}>
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onLoad={() => setLoaded(true)}
            />
          </div>

          {/* Chat Window */}
          <div className={`flex-1 ${isMobile && !selectedConversation ? 'hidden' : ''}`}>
            <ChatWindow 
              conversation={selectedConversation}
              onBack={isMobile ? handleBack : undefined}
            />
          </div>
        </Skeleton>
      </div>
    </Layout>
  );
}
