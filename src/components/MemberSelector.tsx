import { useState, useEffect } from 'react';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';

interface MemberSelectorProps {
  onSelect: (memberId: string) => void;
  onClose: () => void;
  fraudMemberId?: string;
}

export default function MemberSelector({ onSelect, onClose, fraudMemberId }: MemberSelectorProps) {
  const { household } = useCurrentHousehold();
  const { members } = useHouseholdMembers(household?.id);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; angle: number; velocity: number; rotation: number; color: string }>>([]);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  const handleSelect = (memberId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setClickedButton(memberId);

    const colors = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#FFC107', '#9C27B0'];
    const newConfetti = Array.from({ length: 20 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 20;
      const velocity = 50 + Math.random() * 100;
      return {
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        angle,
        velocity,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    setConfetti(newConfetti);

    setTimeout(() => {
      onSelect(memberId);
    }, 600);
  };

  useEffect(() => {
    if (confetti.length > 0) {
      const timer = setTimeout(() => {
        setConfetti([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [confetti]);

  return (
    <>
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${piece.x}px`,
                top: `${piece.y}px`,
                backgroundColor: piece.color,
                animation: `confettiPop 0.8s ease-out forwards`,
                '--tx': `${Math.cos(piece.angle) * piece.velocity}px`,
                '--ty': `${Math.sin(piece.angle) * piece.velocity}px`,
              } as React.CSSProperties & { '--tx': string; '--ty': string }}
            />
          ))}
        </div>
      )}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-4">Qui a fait cette tâche ?</h3>
          <div className="space-y-2">
            {members.map((member) => {
              const displayEmoji = member.emoji || '👤';
              return (
                <button
                  key={member.id}
                  onClick={(e) => handleSelect(member.id, e)}
                  disabled={clickedButton !== null}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{displayEmoji}</span>
                  <span className="font-medium">{member.name}</span>
                  {fraudMemberId === member.id && (
                    <span className="ml-auto text-sm font-semibold text-orange-600">Fraudeur</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            disabled={clickedButton !== null}
            className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}
