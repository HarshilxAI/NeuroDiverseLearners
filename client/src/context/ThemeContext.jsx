import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const interestToTheme = {
    'Space': 'space',
    'Sports': 'sports',
    'Nature': 'nature',
};

export function ThemeProvider({ children }) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.removeAttribute('data-profile');
            return;
        }

        // Apply cognitive profile theme first (ADHD/Dyslexia override interest theme)
        if (user.cognitiveProfile && user.cognitiveProfile !== 'Typical') {
            document.documentElement.setAttribute('data-profile', user.cognitiveProfile);
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.removeAttribute('data-profile');
            const primaryInterest = user.interests?.[0];
            const theme = interestToTheme[primaryInterest] || '';
            if (theme) {
                document.documentElement.setAttribute('data-theme', theme);
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
    }, [user?.interests, user?.cognitiveProfile]);

    return (
        <ThemeContext.Provider value={{}}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
