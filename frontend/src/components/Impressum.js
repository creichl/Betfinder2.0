import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const Impressum = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-container">
      <div className="legal-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Zurück
        </button>

        <h1>Impressum</h1>

        <section className="legal-section">
          <h2>Informationspflicht laut § 5 TMG</h2>
          
          <div className="info-block">
            <p><strong>cr-solutions GmbH</strong></p>
            <p>Brauereistraße 4</p>
            <p>5230 Mattighofen</p>
            <p>Österreich</p>
          </div>

          <div className="info-block">
            <p><strong>Firmenbuchnummer:</strong> FN 441214 w</p>
            <p><strong>Firmenbuchgericht:</strong> Landesgericht Ried im Innkreis</p>
            <p><strong>UID-Nummer:</strong> ATU69909414</p>
          </div>

          <div className="info-block">
            <h3>Kontakt</h3>
            <p><strong>E-Mail:</strong> <a href="mailto:office@cr-solutions.at">office@cr-solutions.at</a></p>
            <p><strong>Website:</strong> <a href="https://betfinder.cloud" target="_blank" rel="noopener noreferrer">betfinder.cloud</a></p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Geschäftsführung</h2>
          <p>Christoph Reichl</p>
        </section>

        <section className="legal-section">
          <h2>Unternehmensgegenstand</h2>
          <p>Software-Entwicklung und IT-Dienstleistungen</p>
        </section>

        <section className="legal-section">
          <h2>Aufsichtsbehörde</h2>
          <p>Bezirkshauptmannschaft Braunau am Inn</p>
          <p>Ringstraße 5, 5280 Braunau am Inn, Österreich</p>
        </section>

        <section className="legal-section">
          <h2>Mitgliedschaften</h2>
          <p>Wirtschaftskammer Österreich</p>
          <p>Fachgruppe Unternehmensberatung, Buchhaltung und Informationstechnologie</p>
        </section>

        <section className="legal-section">
          <h2>Berufsrechtliche Regelungen</h2>
          <ul>
            <li>Gewerbeordnung: <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">www.ris.bka.gv.at</a></li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Online-Streitbeilegung (OS)</h2>
          <p>
            Verbraucher haben die Möglichkeit, Beschwerden an die Online-Streitbeilegungsplattform der EU zu richten:
          </p>
          <p>
            <a href="https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home2.show&lng=DE" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Sie können allfällige Beschwerde auch an die oben angegebene E-Mail-Adresse richten.
          </p>
        </section>

        <section className="legal-section">
          <h2>Haftung für Inhalte</h2>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit 
            und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß 
            § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach 
            §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte 
            fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit 
            hinweisen.
          </p>
        </section>

        <section className="legal-section">
          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten 
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </section>

        <section className="legal-section">
          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen 
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>

        <section className="legal-section">
          <h2>Bildnachweise</h2>
          <p>
            Fußball-Daten und Team-Logos: <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer">Football-Data.org</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Impressum;
