const multiAuth = (middlewareA, middlewareB, middlewareC) => {
    return async (req, res, next) => {
        let isAdminAuthed = false;
        let isTeacherAuthed = false;
        let isStudentAuthed = false;

        try {
            // Try admin auth
            await new Promise((resolve) => {
                middlewareA(req, res, (error) => {
                    if (!error) {
                        isAdminAuthed = true;
                    }
                    resolve();
                });
            });
            
            if (isAdminAuthed) {
            
                return next();
            }

            // Try teacher auth if admin auth failed
            await new Promise((resolve) => {
                middlewareB(req, res, (error) => {
                    if (!error) {
                        isTeacherAuthed = true;
                    }
                    resolve();
                });
            });
            
            if (isTeacherAuthed) {
                return next();
            }

            // Try student auth if both admin and teacher auth failed
            await new Promise((resolve) => {
                middlewareC(req, res, (error) => {
                    if (!error) {
                        isStudentAuthed = true;
                    }
                    resolve();
                });
            });
            
            if (isStudentAuthed) {
                return next();
            }

            // All three failed
            return res.status(401).json({ 
                message: 'Unauthorized - requires admin, teacher, or student privileges' 
            });

        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
    };
};

module.exports = multiAuth;