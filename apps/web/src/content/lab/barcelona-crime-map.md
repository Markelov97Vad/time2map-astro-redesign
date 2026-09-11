---
title: 'Barcelona Crime Map: Safety Index'
navLabel: Barcelona Crime Map
seoTitle: 'Barcelona Crime by Neighborhood: Safety Analysis 2019–2025'
description: >-
  Crime analysis across Catalunya's 59 police zones: a composite safety index
  benchmarked against Spain's national average, with trends from 2019 to 2025.
ogTitle: 'Is Barcelona Safe? A Neighborhood Crime Index vs. Spain'
ogDescription: >-
  Composite safety index across Catalonia's 59 police zones — benchmarked
  against Spain's national average and tracked year by year from 2019 to 2025.
  See which neighborhoods improved, which got worse, and what the data actually
  shows.
publishDate: 2026-05-28
displayDate: May 2026
readTime: 8 min read
heroQuote: >-
  Crime statistics in Catalunya are publicly available — but understanding them
  takes patience. I built this map to make sense of the data: a composite
  safety index across 12 crime types, mapped by police zone, with trends since
  2019 and a comparison against Spain's national average.
mapEmbedUrl: https://catalunya-crimes.time2map.com/
mapHints:
  - icon: /images/icons/sidebar.svg
    text: >-
      Choose a crime type from the left panel — or select Safety Index (vs
      Catalunya or Spain) for a composite view.
  - icon: /images/icons/sliders.svg
    text: Drag the year slider at the bottom to explore data from 2019 to 2025.
  - icon: /images/icons/cursor-click.svg
    text: >-
      Click any zone to see the full crime breakdown and safety score vs.
      regional and national averages.
githubUrl: https://github.com/time2map/catalunya-crime-map
ogImage: /images/lab/barcelona-crime-map/cornella-safety-ranking.png
dataSources:
  - label: Mossos d'Esquadra crime data — ICGC viewer
    url: https://visors.icgc.cat/mapa-delinquencial/
  - label: Ministry of Interior — Statistical Yearbook (Spain)
    url: https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/estadistica/estadisticas-e-informes/seguridad-ciudadana/anuario-estadistico-del-ministerio-del-interior/
  - label: Source code — GitHub
    url: https://github.com/time2map/catalunya-crime-map
authorBio: >-
  Geospatial developer based in Barcelona. I build maps and data tools —
  sometimes for clients, sometimes because the data is interesting. This one
  started as a personal project when I moved to the city and wanted to
  understand my neighbourhood better than the official tools allowed.
---

## Context

### This map vs the official map

The Mossos d'Esquadra publish detailed crime statistics through the [ICGC crime map viewer](https://visors.icgc.cat/mapa-delinquencial/) — a solid resource covering all 59 ABP police zones across Catalunya, with yearly data going back to 2019. There you can filter by crime type, see charts per zone, and compare against the Catalan average. It's a useful starting point, and I used it constantly while building this.

After spending time with it, though, I kept running into the same gaps. There's no composite safety score — you have to click through each crime type one by one, which makes it hard to get an overall feel for a zone. There's no comparison with Spain, only with Catalunya — which matters if you're an expat trying to calibrate what "above average" actually means in practice. And spatial trends are invisible: you can pull a chart for a single zone, but not a regional view of which areas are getting better or worse over time.

## Findings

### What I found

#### Barcelona averages 2–4× worse than the Spanish national average

For an average Spanish relocating to Barcelona, crime rates feel dramatically higher than back home. Across the zones shown — **Sant Martí** (×2.9), **Eixample** (×3.6), **Gràcia** (×1.9) — the pattern is consistent. Catalunya's average is already elevated compared to most Spanish regions, and Barcelona pulls it further. The Barcelona safety index vs. Spain is not close.

![Safety Index comparison chart](/images/lab/barcelona-crime-map/safety-indexes.webp)

*Safety Index vs Spain for Sant Martí, Eixample, and Gràcia — 2025. Values above 1.0 indicate higher crime rates than the Spanish average.*

#### Cornellà de Llobregat is one of the safest zones in the metro area

Safety index vs. Catalonia: **0.775**, rank 23 of 59 among Catalunya. Cornellà consistently comes out among the *safest neighborhoods in the Barcelona* metropolitan area — a fact that rarely gets attention because it's not a central district. I discovered this in the data around the same time I was looking at the area personally. The subjective feeling matches the numbers.

![Cornellà de Llobregat on the safety index map](/images/lab/barcelona-crime-map/cornella-safety-ranking.png)

*Cornellà de Llobregat on the Safety Index (vs Catalonia) map. Lighter colour = lower crime rate relative to the regional average.*

#### Sants-Montjuïc ranks 57 out of 59 — which surprised me

Safety index vs. Catalonia: **1.672**, rank 57 of 59 among Catalunya. That puts Sants-Montjuïc near the bottom of the *Barcelona crime statistics by district* ranking — yet Sants, where I live and know well, feels safe day-to-day. The likely explanation: the ABP zone is geographically large and includes Montjuïc hill, the port area, and industrial zones that pull the average up significantly.

![Sants-Montjuïc safety ranking](/images/lab/barcelona-crime-map/sants-montjuic-safety-rank.webp)

*Sants-Montjuïc ABP zone — Safety Index vs Catalunya, 2025. The large zone boundary includes areas with very different character.*

#### Roses has the highest home intrusion rate in Catalunya

The Alt Empordà – Roses zone, a coastal tourist area on the northern Costa Brava, recorded the highest home intrusion rate in all of Catalunya in 2025 — **0.087 per 1,000 residents**, x10 of Catalan average. Seasonal vacancy during off-peak months is likely a driver: empty holiday homes are a well-documented target. The number stands out even compared to dense urban zones.

![Home intrusion rates across Catalonia](/images/lab/barcelona-crime-map/roses-home-intrusion.png)

*Home intrusion rates across Catalonia (2025). Roses zone circled — highest rate in the region.*

#### Home intrusion hasn't declined anywhere in 5 years

Across all 59 ABP zones, the 2019–2025 trend for home intrusion is flat or rising. Not a single zone shows a sustained downward trend over the full period. The sparkline arrows on the map confirm it region-wide — this isn't isolated spikes in a few areas but a consistent pattern across both urban and rural zones.

![Home intrusion trend map](/images/lab/barcelona-crime-map/home-intrusion-trend.png)

*Home intrusion trend map (2019–2025). Arrows show direction of change per zone — none point down.*

#### Assault is rising across the entire region

The trend map shows upward arrows across virtually every zone. The map show this is not a city-specific phenomenon: rural and coastal zones are affected equally.

![Assault trend across Catalonia](/images/lab/barcelona-crime-map/assault-trend.png)

*Assault trend across Catalonia (2023–2025). Up arrows = increasing rate. Near-universal pattern.*

#### Theft in Barcelona is actually declining

Despite Barcelona's reputation for pickpocketing, theft rates have been falling across most central zones over the last two years (2023–2025). The trend arrows across central Barcelona consistently point downward — a notable counterpoint to the rising assault numbers. From the other side the indexes across Barcelona are still very high.

![Theft trends in Barcelona](/images/lab/barcelona-crime-map/theft-decline.png)

*Theft trends in the Barcelona (2023 vs. 2025). Blue tones + down arrows = declining rate.*

## Methodology

1. **Open data from Mossos d'Esquadra.** Crime statistics downloaded from the ICGC viewer (1,520 vector tiles across all ABP zones). Spanish national averages parsed from the Ministry of Interior annual statistical report.
2. **Composite safety index.** A weighted mean across 12 crime types, normalised against the Catalan and Spanish averages. Weights are calibrated toward outdoor safety — homicide, assault, sexual crimes, robbery, and theft are weighted higher than drug offences or public disorder.

> **A note on limitations.** Crime weights in the safety index are subjective — they reflect my priorities for outdoor safety. You can fork the repo and adjust them. The Spain comparison covers 9 of 12 crime types (2025 data only) — home intrusion, disorder, and drug offences are excluded due to differences in national reporting methodology. ABP zones are large geographic areas; a high-crime zone can contain safe and unsafe pockets that the data can't distinguish.
