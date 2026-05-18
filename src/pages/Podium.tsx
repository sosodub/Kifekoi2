import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import SectionTitle from '@/components/SectionTitle';
import PeriodSelector from '@/components/PeriodSelector';
import { TabType } from '@/components/TabBar';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';
import { useTasks } from '@/hooks/useTasks';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import {
  getPeriodLabel,
  getPeriodDateRange,
  PeriodType,
} from '@/features/podium/lib/podiumUtils';

export default function Podium() {
  const navigate = useNavigate();
  const { household } = useCurrentHousehold();
  const { completions, isLoading } = useTasks(household?.id);
  const { members } = useHouseholdMembers(household?.id);
  const [activePeriod, setActivePeriod] = useState<PeriodType>('week');

  const handleTabChange = (tab: TabType) => {
    if (tab === 'dashboard') {
      navigate('/dashboard');
    } else if (tab === 'history') {
      navigate('/history');
    }
  };

  const scores = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let startDate: Date;
    switch (activePeriod) {
      case 'week':
        startDate = startOfWeek;
        break;
      case 'month':
        startDate = startOfMonth;
        break;
      case 'year':
        startDate = startOfYear;
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const filteredCompletions = completions.filter((c) => {
      const completionDate = new Date(c.done_at);
      return completionDate >= startDate;
    });

    const memberScores = members.map((member) => {
      const memberCompletions = filteredCompletions.filter(
        (c) => c.member_id === member.id
      );
      const points = memberCompletions.reduce(
        (sum, c) => sum + (c.points_awarded || 0),
        0
      );

      return {
        memberId: member.id,
        memberName: member.name,
        avatarEmoji: member.emoji,
        points,
        taskCount: memberCompletions.length,
      };
    });

    return memberScores.sort((a, b) => b.points - a.points);
  }, [members, completions, activePeriod]);

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3);

  const hasScores = scores.some((s) => s.points > 0);

  return (
    <MainLayout activeTab="podium" onTabChange={handleTabChange}>
      <SectionTitle>Podium</SectionTitle>

      <PeriodSelector activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

      <p className="text-xs text-gray-500 mb-6">
        {getPeriodLabel(activePeriod)} - {getPeriodDateRange(activePeriod)}
      </p>

      {isLoading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : !hasScores ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500 mb-2">Aucune tâche complétée pour cette période</p>
          <p className="text-sm text-gray-400">
            Validez des tâches pour voir le classement !
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 justify-center mb-8">
            {top3[1] && (
              <div className="bg-white rounded-xl p-4 shadow-sm w-28 text-center">
                <div className="text-lg mb-2">🥈</div>
                {top3[1].avatarEmoji && (
                  <div className="text-3xl mb-2">{top3[1].avatarEmoji}</div>
                )}
                <p className="font-bold text-sm text-gray-900 mb-1">{top3[1].memberName}</p>
                <p className="text-xs font-semibold text-k-green-dark">
                  {top3[1].points} pts
                </p>
              </div>
            )}

            {top3[0] && (
              <div className="bg-k-green/10 border-2 border-k-green-dark rounded-xl p-4 shadow-lg w-32 text-center relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="text-4xl">👑</span>
                </div>
                {top3[0].avatarEmoji && (
                  <div className="text-4xl mb-2 mt-4">{top3[0].avatarEmoji}</div>
                )}
                <p className="font-bold text-gray-900 mb-1">{top3[0].memberName}</p>
                <p className="text-sm font-semibold text-k-green-dark">
                  {top3[0].points} pts
                </p>
              </div>
            )}

            {top3[2] && (
              <div className="bg-white rounded-xl p-4 shadow-sm w-28 text-center">
                <div className="text-lg mb-2">🥉</div>
                {top3[2].avatarEmoji && (
                  <div className="text-3xl mb-2">{top3[2].avatarEmoji}</div>
                )}
                <p className="font-bold text-sm text-gray-900 mb-1">{top3[2].memberName}</p>
                <p className="text-xs font-semibold text-k-green-dark">
                  {top3[2].points} pts
                </p>
              </div>
            )}
          </div>

          {rest.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Classement complet</h3>
              <div className="space-y-2">
                {rest.map((score, index) => (
                  <div
                    key={score.memberId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-semibold w-6">{index + 4}.</span>
                      {score.avatarEmoji && (
                        <span className="text-2xl">{score.avatarEmoji}</span>
                      )}
                      <p className="font-medium">{score.memberName}</p>
                    </div>
                    <p className="text-sm font-semibold text-k-green-dark">
                      {score.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
