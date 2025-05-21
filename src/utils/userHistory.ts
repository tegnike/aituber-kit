const HISTORY_KEY = 'user_history';

export const addUserToHistory = (userId: string) => {
  const history = getUserHistory();
  if (!history.includes(userId)) {
    history.push(userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const isNewUser = (userId: string): boolean => {
  const history = getUserHistory();
  return !history.includes(userId);
};

export const getUserHistory = (): string[] => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('ユーザー履歴の取得に失敗しました:', error);
    return [];
  }
};
