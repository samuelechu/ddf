/**
 * Copyright (c) Codice Foundation
 *
 * <p>This is free software: you can redistribute it and/or modify it under the terms of the GNU
 * Lesser General Public License as published by the Free Software Foundation, either version 3 of
 * the License, or any later version.
 *
 * <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details. A copy of the GNU Lesser General Public
 * License is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 */
package org.codice.ddf.catalog.ui.query.suggestion;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.codice.ddf.spatial.geocoding.Suggestion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A regex-based processor for identifying potential UTM/UPS coordinate literals in a given input
 * string despite deviations from the official spec. The general policy is to be as forgiving as
 * possible without sacrificing determinism.
 */
public class DmsCoordinateProcessor {
  private static final Logger LOGGER = LoggerFactory.getLogger(DmsCoordinateProcessor.class);

  private static final Character SPACE_CHAR = ' ';

  private static final String DEGREES_LAT_REGEX_STRING = "90|[1-8]?[0-9]";
  private static final String DEGREES_LON_REGEX_STRING = "180|1[0-7][0-9]|[1-9]?[0-9]";

  private static final String MINUTES_SECONDS_REGEX_STRING = "[1-5]?[0-9]";
  private static final String DMS_MINUTES_SECONDS_REGEX_STRING =
      "\\D*(" + MINUTES_SECONDS_REGEX_STRING + ")\\D*(" + MINUTES_SECONDS_REGEX_STRING + ")\\D*";

  private static final String DMS_LAT_REGEX_STRING =
      "\\D*(" + DEGREES_LAT_REGEX_STRING + ")" + DMS_MINUTES_SECONDS_REGEX_STRING + "([NS])\\D*";

  private static final String DMS_LON_REGEX_STRING =
      "\\D*(" + DEGREES_LON_REGEX_STRING + ")" + DMS_MINUTES_SECONDS_REGEX_STRING + "([EW])\\D*";

  private static final int DEGREES_LAT_GROUP = 1;
  private static final int MINUTES_LAT_GROUP = 2;
  private static final int SECONDS_LAT_GROUP = 3;
  private static final char DIRECTION_LAT_GROUP = 4;

  private static final int DEGREES_LON_GROUP = 5;
  private static final int MINUTES_LON_GROUP = 6;
  private static final int SECONDS_LON_GROUP = 7;
  private static final char DIRECTION_LON_GROUP = 8;

  private static final Pattern PATTERN_DMS_COORDINATE =
      Pattern.compile(DMS_LAT_REGEX_STRING + DMS_LON_REGEX_STRING);

  //          Pattern.compile(
  //                  "("
  //                          + UsngCoordinate.ZONE_REGEX_STRING
  //                          + ")"
  //                          + UsngCoordinate.LATITUDE_BAND_PART_ONE_REGEX_STRING
  //                          + "?( )+(\\d){1,6}(me)?( )+(\\d{1,7}|10000000)(mn)?",
  //                  Pattern.CASE_INSENSITIVE);

  private static class CoordinateTranslator {

    private static LatLon dmsToLatLon(String dmsString) {
      Map<String, Object> dmsLat = new HashMap<String, Object>();
      Map<String, Object> dmsLon = new HashMap<String, Object>();

      parseDms(dmsLat, dmsLon, dmsString);
      return toLatLon(dmsLat, dmsLon);
    }

    private static void parseDms(
        Map<String, Object> dmsLat, Map<String, Object> dmsLon, String dmsString) {
      Matcher matcher = PATTERN_DMS_COORDINATE.matcher(dmsString);
      if (matcher.matches()) {
        dmsLat.put("degrees", Integer.parseInt(matcher.group(DEGREES_LAT_GROUP)));
        dmsLat.put("minutes", Integer.parseInt(matcher.group(MINUTES_LAT_GROUP)));
        dmsLat.put("seconds", Integer.parseInt(matcher.group(SECONDS_LAT_GROUP)));
        dmsLat.put("direction", matcher.group(DIRECTION_LAT_GROUP));

        dmsLon.put("degrees", Integer.parseInt(matcher.group(DEGREES_LON_GROUP)));
        dmsLon.put("minutes", Integer.parseInt(matcher.group(MINUTES_LON_GROUP)));
        dmsLon.put("seconds", Integer.parseInt(matcher.group(SECONDS_LON_GROUP)));
        dmsLon.put("direction", matcher.group(DIRECTION_LON_GROUP));
      }
    }

    private static String normalizedDmsString(String dmsString) {
      Map<String, Object> dmsLat = new HashMap<String, Object>();
      Map<String, Object> dmsLon = new HashMap<String, Object>();
      parseDms(dmsLat, dmsLon, dmsString);

      final StringBuilder dmsBuilder = new StringBuilder();
      for (Map<String, Object> dmsPart : Arrays.asList(dmsLat, dmsLon)) {
        dmsBuilder
            .append(dmsPart.get("degrees"))
            .append("°")
            .append(dmsPart.get("minutes"))
            .append("\'")
            .append(dmsPart.get("seconds"))
            .append("\"")
            .append(dmsPart.get("direction") + " ");
      }
      return dmsBuilder.toString().trim();
    }

    private static LatLon toLatLon(Map<String, Object> dmsLat, Map<String, Object> dmsLon) {

      Double lat = toDecimalDegrees(dmsLat);
      Double lon = toDecimalDegrees(dmsLon);

      return new LatLon(lat, lon);
    }

    private static Double toDecimalDegrees(Map<String, Object> dms) {
      int degrees = (int) dms.get("degrees");
      int minutes = (int) dms.get("minutes");
      int seconds = (int) dms.get("seconds");
      return degrees + minutes / 60.0 + seconds / 3600.0;
    }
  }

  // This key tells the UI that the geo is on the suggestion itself
  private static final String LITERAL_SUGGESTION_ID = "LITERAL-DMS";

  /**
   * Given a list of {@link Suggestion}s and the query that yielded them, enhance the list with
   * additional suggestions based upon the presence of coordinate literals in the query string.
   *
   * @param results the list of results to enhance.
   * @param query the user-provided gazetteer query text, which may contain coordinate literals.
   */
  public void enhanceResults(final List<Suggestion> results, final String query) {
    LOGGER.trace("(UTM/UPS) Adding result for query [{}]", query);
    LatLon parsedDms = CoordinateTranslator.dmsToLatLon(query);

    LiteralSuggestion dmsSuggestion = getDmsSuggestion(query);

    results.add(dmsSuggestion);
  }

  private LiteralSuggestion getDmsSuggestion(final String query) {
    final Matcher matcher = PATTERN_DMS_COORDINATE.matcher(query);
    final StringBuilder nameBuilder = new StringBuilder("DMS:");
    matcher.find();
    LatLon parsedDms = CoordinateTranslator.dmsToLatLon(matcher.group());

    nameBuilder
        .append(" [ ")
        .append(CoordinateTranslator.normalizedDmsString(matcher.group()))
        .append(" ]");
    LiteralSuggestion dmsSuggestion =
        new LiteralSuggestion(
            LITERAL_SUGGESTION_ID, nameBuilder.toString(), Arrays.asList(parsedDms));
    return dmsSuggestion;
  }
  /*final StringBuilder nameBuilder = new StringBuilder("UTM/UPS:");
  final List<UtmUpsCoordinate> utmUpsCoords = new ArrayList<>();
    while (matcher.find()) {
    final String group = matcher.group();
    LOGGER.trace("Match found [{}]", group);
    final String utmOrUpsText = normalizeCoordinate(group);
    final UtmUpsCoordinate utmUps = parseUtmUpsString(utmOrUpsText);
    if (utmUps != null) {
      nameBuilder.append(" [ ").append(utmUps.toString()).append(" ]");
      utmUpsCoords.add(utmUps);
    }
  }
    if (utmUpsCoords.isEmpty()) {
    LOGGER.trace("No valid UTM or UPS strings could be inferred from query [{}]", query);
    return null;
  }
    return new LiteralSuggestion(
          LITERAL_SUGGESTION_ID,
          nameBuilder.toString(),
        utmUpsCoords
                .stream()
                .map(this::toLatLon)
            .filter(Objects::nonNull)
            .map(d -> new LatLon(d.getLat(), d.getLon()))
          .collect(Collectors.toList()));*/
}
