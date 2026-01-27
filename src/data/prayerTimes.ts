import { CalculationMethod, Coordinates, Madhab, Prayer, PrayerTimes } from 'adhan';

export type Location = {
  name: string;
  latitude: number;
  longitude: number;
};

export type PrayerTimeEntry = {
  id: string;
  label: string;
  time: Date;
};

export type NextPrayer = {
  id: string;
  label: string;
  time: Date;
  isTomorrow: boolean;
};

export const DEFAULT_LOCATION: Location = {
  name: 'Istanbul, Turkiye',
  latitude: 41.0082,
  longitude: 28.9784,
};

const methodLabel = 'Diyanet (Turkey)';
const madhhabLabel = 'Hanafi';

const prayerLabel = (prayer: Prayer) => {
  switch (prayer) {
    case Prayer.Fajr:
      return 'Fajr';
    case Prayer.Sunrise:
      return 'Sunrise';
    case Prayer.Dhuhr:
      return 'Dhuhr';
    case Prayer.Asr:
      return 'Asr';
    case Prayer.Maghrib:
      return 'Maghrib';
    case Prayer.Isha:
      return 'Isha';
    default:
      return 'Fajr';
  }
};

const prayerId = (prayer: Prayer) => {
  switch (prayer) {
    case Prayer.Fajr:
      return 'fajr';
    case Prayer.Sunrise:
      return 'sunrise';
    case Prayer.Dhuhr:
      return 'dhuhr';
    case Prayer.Asr:
      return 'asr';
    case Prayer.Maghrib:
      return 'maghrib';
    case Prayer.Isha:
      return 'isha';
    default:
      return 'fajr';
  }
};

const getParameters = () => {
  // Diyanet calculations align with the Turkey preset in adhan.
  const params = CalculationMethod.Turkey();
  params.madhab = Madhab.Hanafi;
  return params;
};

export const getPrayerTimes = (
  date: Date,
  location: Location = DEFAULT_LOCATION,
) => {
  const params = getParameters();
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const entries: PrayerTimeEntry[] = [
    { id: 'fajr', label: 'Fajr', time: prayerTimes.fajr },
    { id: 'sunrise', label: 'Sunrise', time: prayerTimes.sunrise },
    { id: 'dhuhr', label: 'Dhuhr', time: prayerTimes.dhuhr },
    { id: 'asr', label: 'Asr', time: prayerTimes.asr },
    { id: 'maghrib', label: 'Maghrib', time: prayerTimes.maghrib },
    { id: 'isha', label: 'Isha', time: prayerTimes.isha },
  ];

  const nextPrayer = prayerTimes.nextPrayer();
  if (nextPrayer === Prayer.None) {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
    return {
      location,
      methodLabel,
      madhhabLabel,
      entries,
      next: {
        id: 'fajr',
        label: 'Fajr',
        time: tomorrowTimes.fajr,
        isTomorrow: true,
      },
    };
  }

  return {
    location,
    methodLabel,
    madhhabLabel,
    entries,
    next: {
      id: prayerId(nextPrayer),
      label: prayerLabel(nextPrayer),
      time: prayerTimes.timeForPrayer(nextPrayer) ?? entries[0].time,
      isTomorrow: false,
    },
  };
};
