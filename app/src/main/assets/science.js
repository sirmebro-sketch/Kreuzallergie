/* Sole medical default policy. Patient statements and broad background lists do not seed it. */
(function(root){
 'use strict';
 function apply(C){
  for(const s of Object.values(C.sources))s.kind='background';
  const primary=(title,url,date,kind='study')=>({title,url,date,kind});
  Object.assign(C.sources,{
   eaaci:primary('EAACI-Leitlinie 2025: Management IgE-vermittelter Lebensmittelallergien','https://onlinelibrary.wiley.com/doi/10.1111/all.16345','2025','guideline'),
   adGuideline:primary('S3-Leitlinie Atopische Dermatitis: Ernährung, Werfel et al. 2024','https://onlinelibrary.wiley.com/doi/10.1111/ddg.15230_g','2024','guideline'),
   celeryStudy:primary('Ballmer-Weber et al. 2024: Api g 7 und Beifuß-assoziierte Sellerieallergie','https://pubmed.ncbi.nlm.nih.gov/38763171/','2024'),
   spiceStudy:primary('Stäger et al. 1991: Gewürz-Sensibilisierung bei ausgewählten Sellerieallergikern','https://pubmed.ncbi.nlm.nih.gov/1957997/','1991'),
   mustardStudy:primary('Figueroa et al. 2005: Senfallergie, Provokation und Beifuß-Assoziation','https://pubmed.ncbi.nlm.nih.gov/15575930/','2005'),
   chamomileStudy:primary('Subiza et al. 1989: Kamillentee-Reaktion und Pollen-Kreuzreaktivität, Einzelfall','https://pubmed.ncbi.nlm.nih.gov/2674263/','1989'),
   sunflowerStudy:primary('Ukleja-Sokołowska et al. 2016: Sonnenblumenkernallergie, Einzelfall','https://pubmed.ncbi.nlm.nih.gov/27222528/','2016'),
   mangoStudy:primary('Ukleja-Sokołowska et al. 2018: Mango/Art-v-1-Kreuzreaktion, Einzelfall','https://pubmed.ncbi.nlm.nih.gov/30410550/','2018'),
   peachStudy:primary('Deng & Yin 2019: LTP-Sensibilisierung, chinesische Beifuß-Kohorte','https://pubmed.ncbi.nlm.nih.gov/30479082/','2019'),
   carrotStudy:primary('Jacob et al. 2020: Verarbeitung und Restallergenität von Dau c 1','https://pubmed.ncbi.nlm.nih.gov/32710524/','2020')
  });
  C.sources.review.kind='review';C.sources.labels.kind='law';
  C.evidenceKinds={clinical:'Klinische Assoziationsstudie',laboratory:'Sensibilisierungs-/Labordaten',case:'Klinischer Einzelfall',regional:'Regionale Beobachtungskohorte',review:'Wissenschaftliche Fachübersicht'};
  const evidence={};
  function ev(ids,kind,sources,summary,limit,processing){for(const id of ids)evidence[id]={kind,sources,summary,limit,processing};}
  ev(['sellerie'],'clinical',['celeryStudy'],'Klinische Sellerieallergie und Api-g-7/Art-v-1-Kreuzreaktivität sind beschrieben.','Ausgewählte Sellerieallergiker wurden untersucht; keine Vorhersage für alle Beifußallergiker.','Bei klinisch relevanter Sellerieallergie sind Reaktionen auch nach Kochen möglich. Erhitzen ist kein allgemeiner Schutz.');
  ev(['karotte'],'review',['review','carrotStudy'],'Karotte wird im Sellerie-Beifuß-Gewürz-Zusammenhang beschrieben.','Die Dau-c-1-Verarbeitungsstudie untersucht Karottenallergenität, nicht die Reaktionshäufigkeit aller Beifußallergiker.','Bei bestätigter Karottenallergie kann nach Verarbeitung Restallergenität verbleiben. Kein generelles Karottenverbot allein wegen Beifuß daraus ableitbar.');
  ev(['anis','fenchel','kuemmel','koriander','cumin','pfeffer','paprika','muskat','zimt','ingwer'],'laboratory',['spiceStudy'],'Eine kleine ausgewählte Gruppe wurde auf Hauttest-/IgE-Reaktionen auf bestimmte Gewürze untersucht.','Sensibilisierung beweist keine klinische Essensreaktion; die Ergebnisse unterscheiden sich zwischen Gewürzen und Personen.','Aus diesen Sensibilisierungsdaten folgt keine validierte sichere Zubereitung: weder allgemein „roh verboten“ noch „gekocht erlaubt“.');
  ev(['petersilie'],'review',['review'],'Petersilie wird in der wissenschaftlichen Übersicht zum Sellerie-Beifuß-Gewürz-Zusammenhang genannt.','Die Übersicht begründet kein Verbot aller Kräuter und keine individuelle Diagnose.');
  ev(['senf'],'clinical',['mustardStudy'],'Klinische Reaktionen und Beifuß-Assoziation wurden in einer ausgewählten Senfallergie-Kohorte untersucht.','Die Auswahl erlaubt keinen Rückschluss, dass alle Beifußallergiker Senf meiden müssen.','Bei bestätigter Senfallergie nicht auf Erhitzen als Schutz verlassen. Keine allgemeine sichere Kochzeit aus der Assoziationsstudie ableitbar.');
  ev(['kamille'],'case',['chamomileStudy'],'Eine Kamillentee-Reaktion mit experimentell untersuchter Beifuß-Kreuzreaktivität ist als Einzelfall publiziert.','Einzelfälle belegen Möglichkeiten, keine Häufigkeit oder allgemeinen Verbote.','Der Fall betraf einen Teeaufguss. Aufbrühen ist bei vorhandener Kamillenallergie somit keine Schutzgarantie.');
  ev(['sonnenblume'],'case',['sunflowerStudy'],'Ein Einzelfall beschreibt Sonnenblumenkernreaktion und Beifuß-bezogene Kreuzreaktivität.','Kein Verbot aller Samen und Saaten daraus ableitbar.','Eine allgemeine Verträglichkeit durch Rösten ist nicht belegt. Kerne und Öle müssen gesondert eingeordnet werden.');
  ev(['mango'],'case',['mangoStudy'],'Ein Einzelfall mit Mango-Reaktion und Art-v-1-Kreuzreaktivität ist publiziert.','Nicht auf alle Früchte oder alle Beifußallergiker übertragbar.');
  ev(['pfirsich'],'regional',['peachStudy'],'Eine chinesische Beifuß-Kohorte untersuchte LTP-Sensibilisierung und Lebensmittelreaktionen, unter anderem auf Pfirsich.','Region, Auswahl und molekulares Profil begrenzen die Übertragbarkeit; kein pauschales Steinobstverbot.','LTP-assoziierte Reaktionen können nach Verarbeitung relevant bleiben. Daraus folgt weder eine allgemeine Kochfreigabe noch ein allgemeines Verbot.');
  for(const f of C.foods){
   delete f.specificDefault;
   f.evidence=evidence[f.id]||null;
   f.association=f.evidence?'mugwort':f.kind==='dish'?'recipe':'none';
   if(f.kind==='dish')continue;
   f.sources=f.evidence?[...new Set([...f.evidence.sources,'eaaci','adGuideline'])]:['eaaci','adGuideline'];
   f.note=f.evidence?f.evidence.summary+' '+f.evidence.limit:'Aus Beifuß-Kreuzallergie oder Neurodermitis allein folgt für dieses Lebensmittel kein allgemeines Meiden. Individuelle Lebensmittelallergien und tatsächliche Beschwerden sind gesondert zu beurteilen.';
  }
  C.guides=[
   {id:'pepper',title:'Pfeffer: Studienlage und Alternativen',tag:'Begrenzte Evidenz',body:'Kein generelles Pfefferverbot allein wegen Beifuß-Kreuzallergie oder Neurodermitis. Die aufgeführte Gewürzstudie untersucht Sensibilisierung in einer ausgewählten Gruppe. Bei bestätigter persönlicher Pfefferallergie gelten individuell geklärte Regeln. Salz und Röstaromen können geschmacklich helfen. Andere Schärfequellen sind weder automatisch kreuzallergen noch automatisch verträglich.',sources:['spiceStudy','eaaci','adGuideline']},
   {id:'heat',title:'Verarbeitung nach Allergen beurteilen',tag:'Zubereitung',body:'Bei klinisch relevanter Sellerieallergie und bestimmten Karottenallergenen sind Reaktionen nach Verarbeitung möglich. Aus Beifuß-Kreuzallergie allein folgt weder eine allgemeine Rohkost-Sperre noch „gekocht erlaubt“. Einträge nennen Nachweistyp und Aussagegrenze der Daten.',sources:['celeryStudy','carrotStudy','eaaci']},
   {id:'labels',title:'„Gewürze“: Was bleibt offen?',tag:'Einkauf',body:'Unter bestimmten Voraussetzungen sind Sammelbezeichnungen für Gewürze/Kräuter zulässig. Bei tatsächlich bekannter individueller Gewürzallergie bleibt die genaue Zusammensetzung wichtig. Sellerie und Senf müssen als kennzeichnungspflichtige Allergene gesondert angegeben werden. Die Kennzeichnungsregel ist kein Nachweis einer persönlichen Allergie.',sources:['labels','pepperLabel','eaaci']},
   {id:'nutrients',title:'Alternativen ohne unnötige Streichliste',tag:'Ernährung',body:'Kein grundsätzlicher Verzicht auf Obst, Gemüse, Nüsse oder Saaten wegen Beifuß oder Neurodermitis. Bei bestätigter Lebensmittelallergie geeignete Ersatzprodukte individuell wählen. Quark ersetzt Obst nicht vollständig; Röstaromen ersetzen Pfefferschärfe nicht identisch. Geschmack, Eiweiß, Ballaststoffe und Mikronährstoffe sind unterschiedliche Ziele. Ernährungstherapie kann notwendige Einschränkungen ausgleichen.',sources:['eaaci','adGuideline']},
   {id:'basics',title:'Studienlage und persönliche Angaben',tag:'Getrennte Ebenen',body:'Die Standardbewertung beruht auf Leitlinien und wissenschaftlicher Literatur. Gesprächsangaben führen zu keinem voreingestellten Lebensmittelverbot. Eigene Markierungen sind zusätzlich und ändern die wissenschaftliche Einordnung nicht. Die Kategorien beschreiben Nachweistypen, keine formalen GRADE-Evidenzstufen.',sources:['eaaci','adGuideline']},
   {id:'eczema',title:'Neurodermitis: keine pauschale Diät',tag:'S3-Leitlinie',body:'Allgemeine diätetische Einschränkungen sollen nicht allein zur Behandlung der Neurodermitis eingesetzt werden. Gezielte Eliminationsdiäten sind bei klinisch relevanter, diagnostisch gesicherter Lebensmittelallergie vorgesehen. Ein positiver Test oder ein zeitlicher Zusammenhang allein genügt nicht als Nachweis. Eine allergologisch geschulte Ernährungsfachkraft kann die ausgewogene Kost unterstützen.',sources:['adGuideline','eaaci']},
   {id:'emergency',title:'Bei einer schweren Reaktion',tag:'Notfall',body:'Bei Atemnot, deutlicher Rachenschwellung oder Kreislaufproblemen nach dem Essen: 112 und persönlichen Notfallplan befolgen. Einen verordneten Adrenalin-Autoinjektor entsprechend der Schulung anwenden. Die App soll keine Notfallbehandlung verzögern.',sources:['eaaci']},
   {id:'traces',title:'Spuren sind keine Rezepturzutat',tag:'Einkauf',body:'„Kann Spuren von … enthalten“ beschreibt mögliche unbeabsichtigte Einträge. Die persönliche Relevanz richtet sich nach der tatsächlich bestehenden Lebensmittelallergie. Ein fehlender Hinweis garantiert keine Spurenfreiheit. Der Zutatencheck erzeugt keine medizinische Freigabe.',sources:['labels','eaaci']},
   {id:'sources',title:'Grenzen wissenschaftlicher Einordnung',tag:'Transparenz',body:'Klinische Assoziation ist keine individuelle Diagnose. Sensibilisierungsdaten sind keine Essensprovokation; Einzelfälle und regionale Kohorten sind keine allgemeine Verbotsliste. „Kein pauschaler Verzicht begründet“ garantiert keine individuelle Verträglichkeit. Quellenstand: 27.10.2026. Hintergrundseiten und Kennzeichnungsrecht erklären Inhalte, bestimmen aber keine medizinische Standardbewertung.',sources:['eaaci','adGuideline','spiceStudy']}
  ];
  C.policy='mugwort-atopic-dermatitis-science-v2';
  return C;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=apply(require('./catalog.js'));else root.Catalog=apply(root.Catalog);
})(typeof globalThis!=='undefined'?globalThis:this);
