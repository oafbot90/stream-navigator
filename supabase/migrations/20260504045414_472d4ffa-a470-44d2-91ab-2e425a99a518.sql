WITH new_series(tmdb_id,title,poster_path) AS (VALUES (254498, 'Luz para a Noite', 'https://image.tmdb.org/t/p/w342/qUhPr2XpczJpnQnXIqJjYaCxOli.jpg'),(300529, 'Direto pro Inferno', 'https://image.tmdb.org/t/p/w342/iBdXm7XHXKlBD5NYWaxzGtb3yFd.jpg'),(270476, 'O Segredo de Widow''s Bay', 'https://image.tmdb.org/t/p/w342/rO22fBhSE77hZjNKSpnp96GC45e.jpg'),(196285, 'Farming Life in Another World', 'https://image.tmdb.org/t/p/w342/mE4pE6NOV3AbvTUE3MkFMlfs12n.jpg')),
ins_series AS (
  INSERT INTO public.series_catalog (tmdb_id,title,poster_path)
  SELECT ns.tmdb_id, ns.title, ns.poster_path FROM new_series ns
  WHERE NOT EXISTS (SELECT 1 FROM public.series_catalog sc WHERE sc.tmdb_id = ns.tmdb_id)
  RETURNING id, tmdb_id
),
all_series AS (
  SELECT id, tmdb_id FROM ins_series
  UNION
  SELECT id, tmdb_id FROM public.series_catalog WHERE tmdb_id IN (SELECT tmdb_id FROM new_series)
),
new_eps(tmdb_id,season_number,episode_number,title) AS (VALUES (254498, 1, 1, 'Episódio 1'),(254498, 1, 2, 'Episódio 2'),(254498, 1, 3, 'Episódio 3'),(254498, 1, 4, 'Episódio 4'),(254498, 1, 5, 'Episódio 5'),(254498, 1, 6, 'Episódio 6'),(254498, 1, 7, 'Episódio 7'),(254498, 1, 8, 'Episódio 8'),(254498, 1, 9, 'Episódio 9'),(254498, 1, 10, 'Episódio 10'),(254498, 1, 11, 'Episódio 11'),(254498, 1, 12, 'Episódio 12'),(254498, 1, 13, 'Episódio 13'),(254498, 1, 14, 'Episódio 14'),(254498, 1, 15, 'Episódio 15'),(254498, 1, 16, 'Episódio 16'),(254498, 1, 17, 'Episódio 17'),(254498, 1, 18, 'Episódio 18'),(254498, 1, 19, 'Episódio 19'),(254498, 1, 20, 'Episódio 20'),(254498, 1, 21, 'Episódio 21'),(254498, 1, 22, 'Episódio 22'),(254498, 1, 23, 'Episódio 23'),(254498, 1, 24, 'Episódio 24'),(254498, 1, 25, 'Episódio 25'),(254498, 1, 26, 'Episódio 26'),(254498, 1, 27, 'Episódio 27'),(254498, 1, 28, 'Episódio 28'),(300529, 1, 1, 'Episódio 1'),(300529, 1, 2, 'Episódio 2'),(300529, 1, 3, 'Episódio 3'),(300529, 1, 4, 'Episódio 4'),(300529, 1, 5, 'Episódio 5'),(300529, 1, 6, 'Episódio 6'),(300529, 1, 7, 'Episódio 7'),(300529, 1, 8, 'Episódio 8'),(300529, 1, 9, 'Último episódio'),(270476, 1, 1, 'Bem-vindos a Widow''s Bay!'),(270476, 1, 2, 'Pousada'),(270476, 1, 3, 'O Nado Inaugural'),(270476, 1, 4, 'Episódio 4'),(270476, 1, 5, 'Episódio 5'),(270476, 1, 6, 'Episódio 6'),(270476, 1, 7, 'Episódio 7'),(270476, 1, 8, 'Episódio 8'),(270476, 1, 9, 'Episódio 9'),(270476, 1, 10, 'Episódio 10'),(196285, 1, 1, 'A Ferramenta Agrícola Onipotente'),(196285, 1, 2, 'A Primeira Aldeã'),(196285, 1, 3, 'Cada Vez Mais Novas Companheiras de Casa'),(196285, 1, 4, 'As hidrovias tornam a vida completa'),(196285, 1, 5, 'Curry e sobrevivendo ao inverno'),(196285, 1, 6, 'Isto é uma Aldeia'),(196285, 1, 7, 'Um Coração Hospitaleiro'),(196285, 1, 8, 'O pesquisador e as duas princesas'),(196285, 1, 9, 'O Mercador e o Dragão'),(196285, 1, 10, 'Princesa Yuri'),(196285, 1, 11, 'A vida cotidiana e o progenitor'),(196285, 1, 12, 'Aniversário'),(196285, 2, 1, 'A História Até Aqui'),(196285, 2, 2, 'Os Imigrantes'),(196285, 2, 3, 'Inverno'),(196285, 2, 4, 'Episódio 4'),(196285, 2, 5, 'Episódio 5'),(196285, 2, 6, 'Episódio 6'),(196285, 2, 7, 'Episódio 7'),(196285, 2, 8, 'Episódio 8'),(196285, 2, 9, 'Episódio 9'),(196285, 2, 10, 'Episódio 10'),(196285, 2, 11, 'Episódio 11'),(196285, 2, 12, 'Episódio 12')),
ins_eps AS (
  INSERT INTO public.series_episodes (series_id, season_number, episode_number, title)
  SELECT asr.id, ne.season_number, ne.episode_number, ne.title
  FROM new_eps ne JOIN all_series asr ON asr.tmdb_id = ne.tmdb_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.series_episodes se
    WHERE se.series_id = asr.id AND se.season_number = ne.season_number AND se.episode_number = ne.episode_number
  )
  RETURNING id, series_id, season_number, episode_number
),
all_eps AS (
  SELECT id, series_id, season_number, episode_number FROM ins_eps
  UNION
  SELECT se.id, se.series_id, se.season_number, se.episode_number FROM public.series_episodes se
  JOIN all_series asr ON asr.id = se.series_id
),
new_streams(tmdb_id,season_number,episode_number,url) AS (VALUES (254498, 1, 1, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913809.mp4'),(254498, 1, 2, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913810.mp4'),(254498, 1, 3, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913811.mp4'),(254498, 1, 4, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913812.mp4'),(300529, 1, 1, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913677.mp4'),(300529, 1, 2, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913678.mp4'),(300529, 1, 3, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913679.mp4'),(300529, 1, 4, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913680.mp4'),(300529, 1, 5, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913681.mp4'),(300529, 1, 6, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913682.mp4'),(300529, 1, 7, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913683.mp4'),(300529, 1, 8, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913684.mp4'),(300529, 1, 9, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913685.mp4'),(270476, 1, 1, 'https://1a-1791.com/video/fwe2/5a/s8/2/W/u/x/j/WuxjA.aaa.mp4'),(196285, 1, 1, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471086.mp4'),(196285, 1, 2, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471087.mp4'),(196285, 1, 3, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471088.mp4'),(196285, 1, 4, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471089.mp4'),(196285, 1, 5, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471090.mp4'),(196285, 1, 6, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471091.mp4'),(196285, 1, 7, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471092.mp4'),(196285, 1, 8, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471093.mp4'),(196285, 1, 9, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471094.mp4'),(196285, 1, 10, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471095.mp4'),(196285, 1, 11, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471096.mp4'),(196285, 1, 12, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/471097.mp4'),(196285, 2, 1, 'https://hubby.cx/series/playcine-vods/Tokken=enicyalp/913604.mp4'))
INSERT INTO public.episode_streams (episode_id, url, quality, stream_type, status)
SELECT ae.id, ns.url, 'HD', 'direct', 'active'
FROM new_streams ns
JOIN all_series asr ON asr.tmdb_id = ns.tmdb_id
JOIN all_eps ae ON ae.series_id = asr.id AND ae.season_number = ns.season_number AND ae.episode_number = ns.episode_number
WHERE NOT EXISTS (
  SELECT 1 FROM public.episode_streams es WHERE es.episode_id = ae.id AND es.url = ns.url
);