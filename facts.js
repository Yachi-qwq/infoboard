var animalFacts = [
  'Seeotter halten beim Schlafen oft Händchen, damit sie nicht auseinander treiben.',
  'Krähen können sich menschliche Gesichter merken und schlechte Erfahrungen weitererzählen.',
  'Oktopusse haben drei Herzen und blaues Blut.',
  'Ziegen haben rechteckige Pupillen, die ihnen ein besonders weites Sichtfeld geben.',
  'Kühe bilden enge Freundschaften und sind gestresst, wenn sie getrennt werden.',
  'Raben können vorausschauend planen und Werkzeuge benutzen.',
  'Elefanten können mit ihren Füßen tiefe Schwingungen im Boden wahrnehmen.',
  'Bienen teilen ihren Artgenossen mit einem Tanz die Richtung zu Futterquellen mit.',
  'Pinguine machen ihrem Partner manchmal einen Antrag mit einem besonders schönen Stein.',
  'Schnecken können je nach Art mehrere Jahre schlafen.',
  'Delfine geben sich individuelle Namen in Form von charakteristischen Pfiffen.',
  'Faultiere verdauen eine Mahlzeit manchmal fast einen Monat lang.',
  'Katzen können mehr als hundert verschiedene Laute erzeugen.',
  'Giraffen haben wie Menschen sieben Halswirbel, nur sind sie deutlich länger.',
  'Axolotl können Teile ihres Herzens, Gehirns und ihrer Gliedmaßen nachbilden.',
  'Papageien benennen ihre Küken mit individuellen Rufen.',
  'Flamingos werden grau geboren und bekommen ihre rosa Farbe durch Nahrung.',
  'Wölfe können sich gegenseitig an der Stimme erkennen, auch wenn sie weit entfernt sind.',
  'Ameisen können das 20-Fache ihres eigenen Körpergewichts tragen.',
  'Zebras haben einzigartige Streifenmuster wie einen persönlichen Barcode.',
  'Kugelfische bauen kunstvolle Sandkreise, um Partner zu beeindrucken.',
  'Koalas haben Fingerabdrücke, die menschlichen erstaunlich ähnlich sind.'
];

var factIndex = -1;
function showRandomFact() {
  var next = Math.floor(Math.random() * animalFacts.length);
  if (animalFacts.length > 1 && next === factIndex) next = (next + 1) % animalFacts.length;
  factIndex = next;
  document.getElementById('fact-text').textContent = animalFacts[next];
}
