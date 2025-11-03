const API = 'http://https://comp4537-term-project-1.onrender.com';

        async function post(path, body) {
            const r = await fetch(API + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            return r.json();
        }

        loginBtn.onclick = async () => {
            msg.textContent = 'Logging in...';
            try {
                const res = await post('/auth/login', {
                    email: email.value,
                    password: pass.value
                });
                if (res.ok) {

                    if (res.user && res.user.role === 'admin'){
                    window.location = 'admin.html';
                    } else {
                        window.location = 'main.html';
                    }
                } else {
                    msg.textContent = 'Login failed: ' + (res.error || 'Invalid credentials');
                    msg.style.color = 'red';
                }
            } catch (e) {
                msg.textContent = 'Error: ' + e.message;
                msg.style.color = 'red';
            }
        };