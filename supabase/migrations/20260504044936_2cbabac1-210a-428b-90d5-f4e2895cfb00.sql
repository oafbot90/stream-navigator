WITH new_movies(tmdb_id, title, poster_path, stream_url) AS (
  VALUES (1104390, 'Anatéma', 'https://image.tmdb.org/t/p/w342/47nFg4yqr19QV5gn9N7BtbQagxh.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913594.mp4'),
(1131460, 'Gafanhoto', 'https://image.tmdb.org/t/p/w342/sRZOq9IGIPe2m1OmLCz5UgP867p.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913593.mp4'),
(1310861, 'O Segredo do Ourives', 'https://image.tmdb.org/t/p/w342/uNuZwlnpH7Dk3H4gWVq9cGe6AwY.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913592.mp4'),
(1013482, 'Um Stalker Apaixonado', 'https://image.tmdb.org/t/p/w342/s5vMwYTvSQxDkTca9jIGJauGzPk.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913591.mp4'),
(1503900, 'Halloween - O Espantalho Assassino', 'https://image.tmdb.org/t/p/w342/ouczezymhTjjs6kJS9JvUj8tvHo.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913590.mp4'),
(1365953, 'O Medo Atrás da Tela', 'https://image.tmdb.org/t/p/w342/zzYnc8OK0z9yq2A2ffrYntXRBxz.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913589.mp4'),
(1371534, 'Ele Te Vê Enquanto Você Dorme', 'https://image.tmdb.org/t/p/w342/ciqCPFDKYtvQjCjjEwGFoj5ywn2.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913588.mp4'),
(1636891, 'Mexicali: Terra sem Lei', 'https://image.tmdb.org/t/p/w342/9lljJwaDdsTXvrs2umGSONO0k4q.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913587.mp4'),
(1073109, 'Push: No Limite do Medo', 'https://image.tmdb.org/t/p/w342/aIOTrlX82mYw6o6LEuMn9yUrhd2.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913586.mp4'),
(1385169, 'Um Conto Sombrio', 'https://image.tmdb.org/t/p/w342/NVOOtkZHRVuLmp16gipDnhNwCy.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913585.mp4'),
(1127375, 'A Dois Passos do Assassino', 'https://image.tmdb.org/t/p/w342/xbBpMvfntGLYSQ3MJ39cOt5NGgD.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913584.mp4'),
(1661439, 'Yiya Murano: Morte na Hora do Chá', 'https://image.tmdb.org/t/p/w342/msoLCiSHuVDIBeD2b3f7BODGbZJ.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913582.mp4'),
(1318447, 'O Jogo do Predador', 'https://image.tmdb.org/t/p/w342/s0ub7FDXEyu8DqGcHKQpaOSem49.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913581.mp4'),
(1453928, 'Krishnamurti: A Revolução do Silêncio', 'https://image.tmdb.org/t/p/w342/zjVka6tCsdTtmCbAyFNxnOU6EO8.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913580.mp4'),
(1270125, 'Monstro a Bordo', 'https://image.tmdb.org/t/p/w342/fGKaYbPMx4ovrx2DlLS4CUarqOS.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913579.mp4'),
(1352643, 'Não Pisque', 'https://image.tmdb.org/t/p/w342/vagg05j0CC1GgyKXF0JjAtBoCej.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913578.mp4'),
(1254808, 'Nouvelle Vague', 'https://image.tmdb.org/t/p/w342/2mGChnRQd75pOWU18B26KlxFMah.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913577.mp4'),
(155128, 'Il corpo', 'https://image.tmdb.org/t/p/w342/mWzxyWAxkv5q3VRw34UCW70JWk8.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913576.mp4'),
(1314912, 'Cigarros Mortais', 'https://image.tmdb.org/t/p/w342/vFO43OAqQLP1ojSLZzQUpB01GGD.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913575.mp4'),
(974927, 'Os Esquecidos: Cicatrizes', 'https://image.tmdb.org/t/p/w342/efAm6HMcYlaQHp5zYI7CBNpsp3f.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913574.mp4'),
(1496142, 'A Memória do Cheiro das Coisas', 'https://image.tmdb.org/t/p/w342/2CO17K4kQVec8Gpja07iC8xNbkJ.jpg', 'https://hubby.cx/movie/playcine-vods/Tokken=enicyalp/913573.mp4'),
(279435, 'Meu Nome é Lampião', 'https://image.tmdb.org/t/p/w342/oU1QGuD7CcWgj5svge4H5mnyeQU.jpg', 'https://1a-1791.com/video/fwe2/22/s8/2/K/u/K/i/KuKiA.aaa.mp4'),
(68173, 'Macunaíma', 'https://image.tmdb.org/t/p/w342/sljH9IqGlLGybyGahoaCQzWg8uq.jpg', 'https://1a-1791.com/video/fwe2/e6/s8/2/U/q/K/i/UqKiA.aaa.mp4')
),
inserted AS (
  INSERT INTO public.movies_catalog (tmdb_id, title, poster_path)
  SELECT nm.tmdb_id, nm.title, nm.poster_path FROM new_movies nm
  WHERE NOT EXISTS (SELECT 1 FROM public.movies_catalog mc WHERE mc.tmdb_id = nm.tmdb_id)
  RETURNING id, tmdb_id
),
all_movies AS (
  SELECT id, tmdb_id FROM inserted
  UNION
  SELECT mc.id, mc.tmdb_id FROM public.movies_catalog mc
  WHERE mc.tmdb_id IN (SELECT tmdb_id FROM new_movies)
)
INSERT INTO public.movie_streams (movie_id, url, quality, stream_type, status)
SELECT am.id, nm.stream_url, 'HD', 'direct', 'active'
FROM new_movies nm
JOIN all_movies am ON am.tmdb_id = nm.tmdb_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.movie_streams ms
  WHERE ms.movie_id = am.id AND ms.url = nm.stream_url
);