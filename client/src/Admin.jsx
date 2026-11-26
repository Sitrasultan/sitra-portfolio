
import { useEffect, useState } from 'react';
import { api, upload, img } from './api.js';

const T = {
  projects: [
    'title', 'summary', 'details', 'category', 'status',
    'tags', 'liveUrl', 'githubUrl', 'imageUrl', 'color', 'order'
  ],
  certificates: ['title', 'issuer', 'year', 'url', 'imageUrl'],
  skills: ['name', 'level']
};

const O = {
  category: ['Full-stack', 'Laravel', 'UI', 'React'],
  status: ['Built', 'In progress', 'Planned', 'Capstone']
};

function Manage({ kind, token }) {
  const [L, setL] = useState([]);
  const [f, setF] = useState({});
  const [e, setE] = useState('');
  const [ok, setOk] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () =>
    api('/' + kind)
      .then(setL)
      .catch(x => setE(x.message));

  useEffect(() => {
    setF({});
    setE('');
    setOk('');
    load();
  }, [kind]);

  const set = (k, v) =>
    setF(o => ({ ...o, [k]: v }));

  const save = async ev => {
    ev.preventDefault();

    const b = {};

    T[kind].forEach(k => {
      if (f[k] !== undefined && f[k] !== '') {
        b[k] = f[k];
      }
    });

    if (typeof b.tags === 'string') {
      b.tags = b.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    ['order', 'level'].forEach(k => {
      if (b[k] !== undefined) b[k] = +b[k];
    });

    // Preserve all project screenshots when editing.
    if (kind === 'projects') {
      b.screenshots = f.screenshots || [];
    }

    try {
      await api(
        '/' + kind + (f._id ? '/' + f._id : ''),
        {
          method: f._id ? 'PUT' : 'POST',
          body: b
        },
        token
      );

      setOk(f._id ? 'Saved changes.' : 'Added.');
      setE('');
      setF({});
      await load();
    } catch (x) {
      setE(x.message);
      setOk('');
    }
  };

  // Upload the main cover image.
  const pickCover = async file => {
    if (!file) return;

    try {
      setUploading(true);
      setE('');

      const url = await upload(file, token);

      setF(o => ({
        ...o,
        imageUrl: url
      }));

      setOk('Cover image uploaded.');
    } catch (x) {
      setE(x.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload multiple screenshots for a project.
  const pickScreenshots = async files => {
    if (!files?.length) return;

    const selected = Array.from(files);

    if (selected.some(file => !file.type.startsWith('image/'))) {
      setE('Please select image files only.');
      return;
    }

    if (selected.some(file => file.size > 5 * 1024 * 1024)) {
      setE('Each image must be 5 MB or smaller.');
      return;
    }

    try {
      setUploading(true);
      setE('');
      setOk('');

      const urls = [];

      // Upload sequentially to avoid overwhelming the server.
      for (const file of selected) {
        const url = await upload(file, token);
        urls.push(url);
      }

      setF(old => {
        const screenshots = [
          ...(old.screenshots || []),
          ...urls
        ];

        return {
          ...old,
          screenshots,
          imageUrl: old.imageUrl || screenshots[0]
        };
      });

      setOk(`${urls.length} screenshot(s) uploaded.`);
    } catch (x) {
      setE(x.message);
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = index => {
    setF(old => {
      const screenshots = [...(old.screenshots || [])];
      const removed = screenshots[index];

      screenshots.splice(index, 1);

      return {
        ...old,
        screenshots,
        imageUrl:
          old.imageUrl === removed
            ? (screenshots[0] || '')
            : old.imageUrl
      };
    });
  };

  const chooseCover = url => {
    setF(old => ({
      ...old,
      imageUrl: url
    }));
  };

  const del = async id => {
    if (!confirm('Delete this item?')) return;

    try {
      await api('/' + kind + '/' + id, {
        method: 'DELETE'
      }, token);

      if (f._id === id) setF({});
      await load();
      setOk('Deleted successfully.');
      setE('');
    } catch (x) {
      setE(x.message);
    }
  };

  const edit = item => {
    setF({
      ...item,
      tags: item.tags?.join(', ') || '',
      screenshots: item.screenshots || []
    });

    setE('');
    setOk('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <form onSubmit={save}>
        {f._id && (
          <b>Editing: {f.title || f.name}</b>
        )}

        {T[kind].map(k =>
          O[k] ? (
            <select
              key={k}
              aria-label={k}
              value={f[k] || O[k][0]}
              onChange={x => set(k, x.target.value)}
            >
              {O[k].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            k === 'summary' || k === 'details' ? (
              <textarea
                key={k}
                placeholder={k}
                value={f[k] || ''}
                onChange={x => set(k, x.target.value)}
              />
            ) : (
              <input
                key={k}
                placeholder={
                  k === 'tags'
                    ? 'Tags (comma separated)'
                    : k === 'imageUrl'
                    ? 'Cover image URL'
                    : k
                }
                value={f[k] || ''}
                onChange={x => set(k, x.target.value)}
              />
            )
          )
        )}

        {T[kind].includes('imageUrl') && (
          <div className="gallery-admin">
            <b>Project cover image</b>

            {f.imageUrl && (
              <img
                className="admin-preview"
                src={img(f.imageUrl)}
                alt="Project cover preview"
              />
            )}

            <label>
              Upload cover image
              <input
                type="file"
                accept="image/*"
                onChange={x => pickCover(x.target.files[0])}
              />
            </label>
          </div>
        )}

        {kind === 'projects' && (
          <div className="gallery-admin">
            <h3>Project screenshots</h3>

            <p>
              Upload multiple screenshots showing different pages
              of your project. Each image can be up to 5 MB.
            </p>

            <label className="screenshot-upload">
              <span>＋ Add project screenshots</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={x => {
                  pickScreenshots(x.target.files);
                  x.target.value = '';
                }}
              />
            </label>

            {uploading && (
              <p className="ok">Uploading images, please wait...</p>
            )}

            {(f.screenshots || []).length > 0 && (
              <>
                <p>
                  **{f.screenshots.length} screenshot(s) added**
                </p>

                <div className="admin-gallery">
                  {f.screenshots.map((url, index) => (
                    <div className="admin-shot" key={url + index}>
                      <img
                        src={img(url)}
                        alt={`Project screenshot ${index + 1}`}
                      />

                      <div className="admin-shot-actions">
                        <button
                          type="button"
                          className="x"
                          onClick={() => chooseCover(url)}
                        >
                          {f.imageUrl === url
                            ? '✓ Cover image'
                            : 'Set as cover'}
                        </button>

                        <button
                          type="button"
                          className="x"
                          onClick={() => removeScreenshot(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="btn p"
          type="submit"
          disabled={uploading}
        >
          {f._id ? 'Save changes' : 'Add'}
        </button>

        {f._id && (
          <button
            type="button"
            className="x"
            onClick={() => setF({})}
          >
            Cancel edit
          </button>
        )}

        {e && <span className="err">{e}</span>}
        {ok && <span className="ok">{ok}</span>}
      </form>

      {L.map(i => (
        <div className="row" key={i._id}>
          <span>
            <b>{i.title || i.name}</b>{' '}
            {i.category || i.issuer || i.level || ''}
            {i.imageUrl ? ' · cover ✓' : ''}
            {kind === 'projects' &&
              ` · ${i.screenshots?.length || 0} screenshots`}
          </span>

          <span>
            <button
              className="x"
              onClick={() => edit(i)}
            >
              Edit
            </button>

            <button
              className="x"
              onClick={() => del(i._id)}
            >
              Delete
            </button>
          </span>
        </div>
      ))}
    </>
  );
}

function Inbox({ token }) {
  const [L, setL] = useState([]);

  const load = () =>
    api('/messages', {}, token)
      .then(setL)
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  return L.length ? (
    L.map(m => (
      <div className="row" key={m._id}>
        <span>
          <b>{m.name}</b> ({m.email})
          <br />
          {m.message}
        </span>

        <button
          className="x"
          onClick={async () => {
            await api(
              '/messages/' + m._id,
              { method: 'DELETE' },
              token
            );
            load();
          }}
        >
          Delete
        </button>
      </div>
    ))
  ) : (
    <p>No messages yet.</p>
  );
}

export default function Admin() {
  const [t, setT] = useState(
    localStorage.getItem('tok') || ''
  );

  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('projects');

  const login = async e => {
    e.preventDefault();

    try {
      const r = await api('/login', {
        method: 'POST',
        body: { password: pw }
      });

      localStorage.setItem('tok', r.token);
      setT(r.token);
      setErr('');
    } catch (x) {
      setErr(x.message);
    }
  };

  if (!t) {
    return (
      <div className="adm w">
        <h1>Admin login</h1>

        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
          />

          <button className="btn p" type="submit">
            Log in
          </button>

          {err && <span className="err">{err}</span>}
        </form>
      </div>
    );
  }

  return (
    <div className="adm w">
      <h1>Admin</h1>

      <p>
        Manage projects, certificates, skills and messages.
        {' '}
        <a href="/">View site</a>
        {' · '}
        <button
          className="x"
          onClick={() => {
            localStorage.removeItem('tok');
            setT('');
          }}
        >
          Log out
        </button>
      </p>

      <div className="tabs">
        {['projects', 'certificates', 'skills', 'messages'].map(k => (
          <button
            key={k}
            className={tab === k ? 'on' : ''}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {tab === 'messages'
        ? <Inbox token={t} />
        : <Manage kind={tab} token={t} />}
    </div>
  );
}
